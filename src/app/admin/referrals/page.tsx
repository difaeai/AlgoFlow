
'use client';

import { AdminShell } from "../_components/admin-shell";
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
import { useCollection } from "@/firebase/firestore/use-collection";
import { useMemo } from "react";
import { useUser, useFirestore } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { collection, query } from "firebase/firestore";

interface User {
    id: string;
    displayName: string;
    email: string;
    referralCode: string;
    referrerId?: string;
    upline: string[];
    isAdmin?: boolean;
}

interface UserProfile {
    isAdmin?: boolean;
}


export default function AdminReferralsPage() {
    const firestore = useFirestore();
    const { user: adminUser } = useUser();
    const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', adminUser?.uid);

    const usersQuery = useMemo(() => {
        if (!firestore || !userProfile?.isAdmin) return null;
        return query(collection(firestore, 'users'));
    }, [firestore, userProfile?.isAdmin]);

    const { data: users, loading: usersLoading } = useCollection<User>(usersQuery);

    const usersById = useMemo(() => {
        if (!users) return {};
        return users.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
        }, {} as Record<string, User>);
    }, [users]);
    
    const loading = profileLoading || usersLoading;


  return (
    <AdminShell title="Referral Network">
      <Card>
        <CardHeader>
          <CardTitle>User Referral Structure</CardTitle>
          <CardDescription>
            Overview of the referral network and upline structure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Referral Code</TableHead>
                <TableHead>Upline (5 Levels)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                    <TableCell colSpan={3} className="text-center">Loading users...</TableCell>
                </TableRow>
              ) : !users || users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    No users in the system yet.
                  </TableCell>
                </TableRow>
              ) : (
                users.filter(u => !u.isAdmin).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                        <div>{user.displayName || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>{user.referralCode}</TableCell>
                    <TableCell>
                        <div className="flex flex-col gap-1">
                            {user.upline && user.upline.length > 0 ? (
                                user.upline.map((uid, index) => (
                                <div key={uid} className="text-xs">
                                    <span className="font-semibold">L{index + 1}:</span> {usersById[uid]?.email || uid}
                                </div>
                            ))) : (
                                <div className="text-xs text-muted-foreground">No upline</div>
                            )}
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
