
'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { AdminShell } from "../_components/admin-shell";
import { Input } from "@/components/ui/input";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore, useUser } from "@/firebase";
import { doc, updateDoc, writeBatch, collection, serverTimestamp, addDoc, query } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useState } from "react";
import Link from 'next/link';
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useDoc } from "@/firebase/firestore/use-doc";
import Image from "next/image";

interface Subscription {
    id: string;
    userId: string;
    planId: string;
    status: 'pending_approval' | 'active' | 'rejected';
    paidAmount: number;
    paymentProofUrl: string;
    createdAt: { seconds: number };
    approvedAt?: { seconds: number };
    approvedBy?: string;
}

interface User {
    id: string;
    email: string;
    displayName?: string;
    upline?: string[];
    isAdmin?: boolean;
    planId?: string;
    profitShare?: number;
}

interface UserProfile {
    isAdmin?: boolean;
}

const commissionRates = [0.005, 0.004, 0.003, 0.002, 0.001]; // L1 to L5

function PendingTab({ subscriptions, usersById, loading }) {
    const firestore = useFirestore();
    const { user: adminUser } = useUser();
    const { toast } = useToast();
    const [selectedProof, setSelectedProof] = useState<string | null>(null);

    const handleApprove = async (subscription: Subscription) => {
        if (!firestore || !adminUser?.uid) {
             toast({ variant: "destructive", title: "Error", description: "You must be logged in as an admin." });
            return;
        }

        const user = usersById.get(subscription.userId);
        if (!user) {
            toast({ variant: "destructive", title: "Error", description: "Could not find user to approve." });
            return;
        }

        const batch = writeBatch(firestore);

        // Step 1: Update subscription status
        const subRef = doc(firestore, 'subscriptions', subscription.id);
        batch.update(subRef, { status: 'active' as const, approvedAt: serverTimestamp(), approvedBy: adminUser.uid });

        // Step 2: Update user status and plan
        const userRef = doc(firestore, 'users', subscription.userId);
        batch.update(userRef, { subscriptionStatus: 'active' as const, planId: subscription.planId });

        // Step 3: Distribute commissions
        if (user.upline && user.upline.length > 0) {
            for (let i = 0; i < user.upline.length; i++) {
                if (i >= 5) break;

                const referrerId = user.upline[i];
                const rate = commissionRates[i];
                const commissionAmount = subscription.paidAmount * rate;

                const commissionData = {
                    userId: referrerId,
                    fromUserId: subscription.userId,
                    subscriptionId: subscription.id,
                    amount: commissionAmount,
                    level: i + 1,
                    rate: rate,
                    createdAt: serverTimestamp(),
                };
                // Create a new doc ref for each commission in the subcollection
                const commissionRef = doc(collection(firestore, `users/${referrerId}/commissions`));
                batch.set(commissionRef, commissionData);
            }
        }

        try {
            await batch.commit();
            toast({
                title: "Subscription Approved",
                description: `${user.email}'s subscription is now active and commissions have been distributed.`
            });
        } catch (error) {
            console.error("Approval failed:", error);
            toast({
                variant: 'destructive',
                title: 'Approval Failed',
                description: 'Could not approve the subscription. Please check console for permission errors.',
            });
        }
    };
    
    const handleReject = async (subscription: Subscription) => {
        if (!firestore || !adminUser?.uid) {
            toast({ variant: "destructive", title: "Error", description: "You must be logged in as an admin to perform this action." });
            return;
        }
        
        const user = usersById.get(subscription.userId);
        if (!user) {
            toast({ variant: "destructive", title: "Error", description: "Could not find user to reject." });
            return;
        }

        try {
            // Update subscription to 'rejected'
            const subRef = doc(firestore, 'subscriptions', subscription.id);
            await updateDoc(subRef, { status: 'rejected' as const })
            .catch(serverError => {
                const permissionError = new FirestorePermissionError({
                    path: subRef.path,
                    operation: 'update',
                    requestResourceData: { status: 'rejected' }
                });
                errorEmitter.emit('permission-error', permissionError);
                throw serverError; // Re-throw to be caught by the outer catch
            });

            // Update user to 'inactive'
            const userRef = doc(firestore, 'users', subscription.userId);
            await updateDoc(userRef, { subscriptionStatus: 'rejected' as const })
            .catch(serverError => {
                const permissionError = new FirestorePermissionError({
                    path: userRef.path,
                    operation: 'update',
                    requestResourceData: { subscriptionStatus: 'rejected' }
                });
                errorEmitter.emit('permission-error', permissionError);
                throw serverError; // Re-throw to be caught by the outer catch
            });
            
            toast({ title: "Subscription Rejected", description: `${user.email}'s subscription has been rejected.` });
        } catch (error) {
             console.error("Rejection failed:", error);
             toast({
                variant: 'destructive',
                title: 'Rejection Failed',
                description: 'Could not reject the subscription. Please check console for permission errors.',
            });
        }
    };

    return (
        <>
        <Dialog open={!!selectedProof} onOpenChange={(isOpen) => !isOpen && setSelectedProof(null)}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Payment Proof</DialogTitle>
                    <DialogDescription>Review the uploaded payment proof below.</DialogDescription>
                </DialogHeader>
                {selectedProof && (
                <div className="relative h-[600px] w-full mt-4">
                    <Image src={selectedProof} alt="Payment Proof" layout="fill" objectFit="contain" />
                </div>
                )}
            </DialogContent>
        </Dialog>
        <Card>
        <CardHeader>
          <CardTitle>Pending Subscriptions</CardTitle>
          <CardDescription>
            Review and approve manual subscription payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                  <TableRow><TableCell colSpan="5" className="text-center">Loading...</TableCell></TableRow>
              ) : !subscriptions || subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan="5" className="text-center text-muted-foreground">No pending subscriptions.</TableCell>
                </TableRow>
              ) : (
              subscriptions.map((sub) => {
                const user = usersById.get(sub.userId);
                return (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div className="font-medium">{user?.displayName || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">
                      {user?.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{sub.planId}</Badge>
                  </TableCell>
                  <TableCell>${sub.paidAmount.toFixed(2)}</TableCell>
                  <TableCell>{new Date(sub.createdAt.seconds * 1000).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedProof(sub.paymentProofUrl)}>
                            View Proof
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(sub)}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(sub)}>Reject</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )})
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </>
    )
}

function ApprovedTab({ subscriptions, usersById, loading }) {
    return (
        <Card>
        <CardHeader>
          <CardTitle>Approved Payments</CardTitle>
          <CardDescription>
            A history of all approved subscription payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Approved Date</TableHead>
                <TableHead>Approved By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                  <TableRow><TableCell colSpan="5" className="text-center">Loading...</TableCell></TableRow>
              ) : !subscriptions || subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan="5" className="text-center text-muted-foreground">No approved payments.</TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => {
                  const user = usersById.get(sub.userId);
                  const admin = sub.approvedBy ? usersById.get(sub.approvedBy) : null;
                  return (
                    <TableRow key={sub.id}>
                    <TableCell>
                        <div className="font-medium">{user?.displayName || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">
                        {user?.email}
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline">{sub.planId}</Badge>
                    </TableCell>
                    <TableCell>${sub.paidAmount.toFixed(2)}</TableCell>
                    <TableCell>{sub.approvedAt ? new Date(sub.approvedAt.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{admin?.email || sub.approvedBy || 'N/A'}</TableCell>
                    </TableRow>
                )})
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
}

function ProfitShareSettingsTab({ users, loading }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [profitShareValues, setProfitShareValues] = useState({});

    const handleUpdateProfitShare = async (userId: string) => {
        if (!firestore) return;
        const newProfitShare = profitShareValues[userId];
        if (newProfitShare === undefined || newProfitShare === '' || isNaN(Number(newProfitShare))) {
            toast({ variant: 'destructive', title: "Invalid Input", description: "Please enter a valid number."});
            return;
        }

        const userRef = doc(firestore, 'users', userId);
        const profitShareData = { profitShare: Number(newProfitShare) };

        try {
            await updateDoc(userRef, profitShareData);
            toast({ title: "Success", description: "Profit share percentage updated."});
        } catch (error) {
            console.error("Profit share update failed:", error);
            const permissionError = new FirestorePermissionError({
                path: userRef.path,
                operation: 'update',
                requestResourceData: profitShareData
              });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update profit share. Check console for errors.'});
        }
    };
    
    const handleInputChange = (userId, value) => {
        setProfitShareValues(prev => ({ ...prev, [userId]: value }));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profit Sharing Settings</CardTitle>
                <CardDescription>
                    Set the profit sharing percentage for each user. Default is 3.5%.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Current %</TableHead>
                        <TableHead className="w-[150px]">New %</TableHead>
                        <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan="5" className="text-center">Loading users...</TableCell>
                            </TableRow>
                        ) : !users || users.length === 0 ? (
                           <TableRow>
                                <TableCell colSpan="5" className="text-center text-muted-foreground">No users to configure.</TableCell>
                            </TableRow>
                        ) : (
                            users.filter(u => !u.isAdmin).map((user) => (
                            <TableRow key={user.id}>
                            <TableCell className="font-medium">
                                <div>{user.displayName}</div>
                                <div className="text-sm text-muted-foreground">
                                {user.email}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">{user.planId || 'N/A'}</Badge>
                            </TableCell>
                            <TableCell>{user.profitShare || '3.5'}%</TableCell>
                            <TableCell>
                                <Input 
                                  type="text" 
                                  placeholder={String(user.profitShare || '3.5')}
                                  value={profitShareValues[user.id] || ''}
                                  onChange={(e) => handleInputChange(user.id, e.target.value)}
                                  className="h-8"
                                />
                            </TableCell>
                            <TableCell>
                                <Button size="sm" onClick={() => handleUpdateProfitShare(user.id)}>Update</Button>
                            </TableCell>
                            </TableRow>
                        )))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

function FeeInvoicesTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Profit Invoices</CardTitle>
                <CardDescription>
                    Track and manage outstanding profit sharing fee payments from users.
                </CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount Due</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No pending invoices.</TableCell>
                  </TableRow>
                
              </TableBody>
            </Table>
            </CardContent>
        </Card>
    );
}


export default function AdminSubscriptionsPage() {
    const firestore = useFirestore();
    const { user: adminUser } = useUser();
    const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', adminUser?.uid);

    const subsQuery = useMemo(() => {
        if (!firestore || !userProfile?.isAdmin) return null;
        return query(collection(firestore, 'subscriptions'));
    }, [firestore, userProfile?.isAdmin]);
    const { data: subscriptions, loading: subsLoading } = useCollection<Subscription>(subsQuery);
    
    const usersQuery = useMemo(() => {
        if (!firestore || !userProfile?.isAdmin) return null;
        return collection(firestore, 'users');
    }, [firestore, userProfile?.isAdmin]);
    const { data: users, loading: usersLoading } = useCollection<User>(usersQuery);

    const { pendingSubscriptions, approvedSubscriptions } = useMemo(() => {
        if (!subscriptions) return { pendingSubscriptions: [], approvedSubscriptions: [] };
        return {
            pendingSubscriptions: subscriptions.filter(s => s.status === 'pending_approval'),
            approvedSubscriptions: subscriptions.filter(s => s.status === 'active'),
        };
    }, [subscriptions]);

    const usersById = useMemo(() => {
        if (!users) return new Map();
        return users.reduce((acc, user) => {
            acc.set(user.id, user);
            return acc;
        }, new Map<string, User>());
    }, [users]);
    
    const isLoading = profileLoading || (userProfile?.isAdmin && (subsLoading || usersLoading));

  return (
    <AdminShell title="Subscription & Fee Management">
      <Tabs defaultValue="pending">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="pending">Pending Subscriptions</TabsTrigger>
          <TabsTrigger value="invoices">Profit Invoices</TabsTrigger>
          <TabsTrigger value="approved">Approved Payments</TabsTrigger>
          <TabsTrigger value="settings">Profit Share Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
            <PendingTab subscriptions={pendingSubscriptions} usersById={usersById} loading={isLoading} />
        </TabsContent>
        <TabsContent value="invoices">
            <FeeInvoicesTab />
        </TabsContent>
        <TabsContent value="approved">
            <ApprovedTab subscriptions={approvedSubscriptions} usersById={usersById} loading={isLoading} />
        </TabsContent>
        <TabsContent value="settings">
            <ProfitShareSettingsTab users={users} loading={isLoading} />
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}
