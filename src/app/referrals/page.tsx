
'use client';

import { DashboardShell } from "@/components/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase/auth/use-user";
import { useDoc } from "@/firebase/firestore/use-doc";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useEffect, useState, useMemo } from "react";
import { collection, query } from "firebase/firestore";
import { useFirestore } from "@/firebase";

interface UserProfile {
    id: string;
    referralCode: string;
}

interface Commission {
    id: string;
    fromUserId: string;
    amount: number;
    level: number;
    createdAt: { seconds: number };
}

interface FromUser {
    id: string;
    email: string;
}

function CommissionRow({ commission }: { commission: Commission }) {
    const { data: fromUser, loading } = useDoc<FromUser>('users', commission.fromUserId);

    if (loading) {
        return (
            <TableRow>
                <TableCell>{new Date(commission.createdAt.seconds * 1000).toLocaleDateString()}</TableCell>
                <TableCell>Loading...</TableCell>
                <TableCell>Level {commission.level}</TableCell>
                <TableCell className="font-medium">${commission.amount.toFixed(2)}</TableCell>
            </TableRow>
        )
    }

    return (
        <TableRow>
            <TableCell>{new Date(commission.createdAt.seconds * 1000).toLocaleDateString()}</TableCell>
            <TableCell>{fromUser?.email || commission.fromUserId}</TableCell>
            <TableCell>Level {commission.level}</TableCell>
            <TableCell className="font-medium">${commission.amount.toFixed(2)}</TableCell>
        </TableRow>
    )
}

export default function ReferralsPage() {
    const { toast } = useToast();
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();
    const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', user?.uid);
    
    const commissionsQuery = useMemo(() => {
        if (!firestore || !user?.uid) return null;
        return collection(firestore, `users/${user.uid}/commissions`);
    }, [firestore, user?.uid]);
    const { data: commissions, loading: commissionsLoading } = useCollection<Commission>(commissionsQuery);
    
    const [referralLink, setReferralLink] = useState('');
    
    useEffect(() => {
        if (typeof window !== 'undefined' && userProfile?.referralCode) {
            const origin = window.location.origin;
            setReferralLink(`${origin}/signup?ref=${userProfile.referralCode}`);
        }
    }, [userProfile]);


    const totalEarnings = useMemo(() => {
        if (!commissions) return 0;
        return commissions.reduce((sum, c) => sum + c.amount, 0);
    }, [commissions]);

    const loadingData = userLoading || profileLoading || commissionsLoading;

    const copyToClipboard = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink);
        toast({
            title: "Copied to Clipboard",
            description: "Your referral link has been copied.",
        });
    }

  return (
    <DashboardShell title="Referral Program">
      <div className="grid gap-6">
         <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Total Referrals</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">N/A</p>
                    <p className="text-xs text-muted-foreground">This feature is currently unavailable.</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Total Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">${loadingData ? '...' : totalEarnings.toFixed(2)}</p>
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Your Referral Link</CardTitle>
                <CardDescription>Share this link to invite others. You'll earn rewards for every qualified signup.</CardDescription>
            </CardHeader>
            <CardContent>
                {loadingData ? <p>Loading referral link...</p> : (
                    <div className="flex w-full max-w-md items-center space-x-2">
                        <Input type="text" readOnly value={referralLink} />
                        <Button type="submit" size="icon" onClick={copyToClipboard} disabled={!referralLink}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Commission History</CardTitle>
            <CardDescription>A log of all referral commissions you have earned.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>From User</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingData ? (
                     <TableRow>
                        <TableCell colSpan="4" className="text-center">Loading commissions...</TableCell>
                    </TableRow>
                ) : !commissions || commissions.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan="4" className="text-center text-muted-foreground">
                            No commissions earned yet.
                        </TableCell>
                    </TableRow>
                ) : (
                    commissions.map((comm) => (
                       <CommissionRow key={comm.id} commission={comm} />
                    ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
