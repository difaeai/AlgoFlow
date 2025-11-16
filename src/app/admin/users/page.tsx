
'use client';

import { useState, useMemo } from "react";
import { MoreHorizontal } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminShell } from "../_components/admin-shell";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useFirestore, useUser } from "@/firebase";
import { collection, doc, updateDoc, query } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useDoc } from "@/firebase/firestore/use-doc";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


interface User {
    id: string;
    displayName: string;
    email: string;
    subscriptionStatus: string;
    createdAt: { seconds: number };
    isAdmin?: boolean;
}

interface UserProfile {
    isAdmin?: boolean;
}

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', adminUser?.uid);
  const { toast } = useToast();

  const [suspendingUser, setSuspendingUser] = useState<User | null>(null);

  const usersQuery = useMemo(() => {
    if (!firestore || !userProfile?.isAdmin) return null;
    return query(collection(firestore, 'users'));
  }, [firestore, userProfile?.isAdmin]);

  const { data: users, loading: usersLoading } = useCollection<User>(usersQuery);

  const handleSuspend = async () => {
    if (!firestore || !suspendingUser) return;

    const userRef = doc(firestore, 'users', suspendingUser.id);
    try {
      await updateDoc(userRef, { subscriptionStatus: 'inactive' });
      toast({
        title: "User Suspended",
        description: `${suspendingUser.email} has been suspended.`,
      });
    } catch (error) {
      console.error("Error suspending user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not suspend the user.",
      });
    } finally {
      setSuspendingUser(null);
    }
  };


  const regularUsers = useMemo(() => users?.filter(u => !u.isAdmin) || [], [users]);
  
  const loading = profileLoading || usersLoading;

  return (
    <>
      <AlertDialog open={!!suspendingUser} onOpenChange={() => setSuspendingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will suspend the user's subscription and deactivate their trading bots. They will need to re-subscribe to regain access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspend}>Confirm Suspension</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AdminShell title="User Management">
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage your users and view their details.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan="4"
                      className="text-center text-muted-foreground"
                    >
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : !regularUsers || regularUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan="4"
                      className="text-center text-muted-foreground"
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  regularUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div>{user.displayName || user.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.subscriptionStatus === "active" ? "default" : "secondary"
                          }
                          className={
                            user.subscriptionStatus === "active"
                              ? "bg-green-500/20 text-green-700 border-transparent"
                              : user.subscriptionStatus === "pending"
                              ? "bg-amber-500/20 text-amber-700 border-transparent"
                              : ""
                          }
                        >
                          {user.subscriptionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setSuspendingUser(user)}
                              disabled={user.subscriptionStatus !== 'active'}
                            >
                              Suspend User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </AdminShell>
    </>
  );
}
