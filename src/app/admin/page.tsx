
'use client';
import {
  Activity,
  ArrowUpRight,
  CircleUser,
  CreditCard,
  DollarSign,
  Menu,
  Package2,
  Search,
  Users,
  BadgePercent,
  FileCheck,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import Link from "next/link";
import { AdminShell } from "./_components/admin-shell";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { useFirestore, useUser } from "@/firebase";
import { useEffect, useMemo } from "react";
import { useDoc } from "@/firebase/firestore/use-doc";
import { useRouter } from "next/navigation";

interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'pending_approval' | 'active' | 'rejected';
  paidAmount: number;
  paymentProofUrl: string;
  createdAt: { seconds: number };
}

interface User {
  id: string;
  email: string;
  displayName?: string;
  subscriptionStatus?: string;
  isAdmin?: boolean;
}

interface UserProfile {
    isAdmin?: boolean;
}

export default function AdminDashboard() {
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', user?.uid);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  const usersQuery = useMemo(() => {
    if (!firestore || !userProfile?.isAdmin) return null;
    return collection(firestore, 'users');
  }, [firestore, userProfile?.isAdmin]);

  const subsQuery = useMemo(() => {
    if (!firestore || !userProfile?.isAdmin) return null;
    return query(
        collection(firestore, 'subscriptions'),
        orderBy('createdAt', 'desc')
    );
  }, [firestore, userProfile?.isAdmin]);

  const { data: users, loading: usersLoading } = useCollection<User>(usersQuery);
  const { data: subscriptions, loading: subsLoading } = useCollection<Subscription>(subsQuery);

  const {
    totalRevenue,
    activeUsers,
    pendingSubscriptions,
    recentSubscriptionRequests,
    usersById,
  } = useMemo(() => {
    if (!users || !subscriptions) return { totalRevenue: 0, activeUsers: 0, pendingSubscriptions: 0, recentSubscriptionRequests: [], usersById: new Map() };

    const activeSubs = subscriptions.filter(s => s.status === 'active');
    const revenue = activeSubs.reduce((sum, sub) => sum + sub.paidAmount, 0);

    const userMap = new Map<string, User>();
    users.forEach(u => userMap.set(u.id, u));

    const activeUserCount = users.filter(u => u.subscriptionStatus === 'active' && !u.isAdmin).length;
    const pendingSubCount = subscriptions.filter(s => s.status === 'pending_approval').length;
    const recentSubs = subscriptions.filter(s => s.status === 'pending_approval').slice(0, 5);
    
    return {
      totalRevenue: revenue,
      activeUsers: activeUserCount,
      pendingSubscriptions: pendingSubCount,
      recentSubscriptionRequests: recentSubs,
      usersById: userMap,
    };
  }, [users, subscriptions]);

  const isLoading = userLoading || profileLoading || (userProfile?.isAdmin && (usersLoading || subsLoading));


  return (
    <AdminShell title="Dashboard">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${isLoading ? '...' : totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : activeUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Subscriptions
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : pendingSubscriptions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Fee Invoices
            </CardTitle>
            <BadgePercent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Feature not implemented.
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8">
        <Card>
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Recent Subscription Requests</CardTitle>
              <CardDescription>
                New users who have paid and are awaiting approval.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/admin/subscriptions">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
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
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan="5" className="text-center text-muted-foreground">Loading...</TableCell>
                    </TableRow>
                ) : recentSubscriptionRequests.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan="5"
                      className="text-center text-muted-foreground"
                    >
                      No recent subscription requests.
                    </TableCell>
                  </TableRow>
                ) : (
                    recentSubscriptionRequests.map(sub => {
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
                                     <Button asChild size="sm" variant="outline">
                                        <Link href="/admin/subscriptions">Review</Link>
                                     </Button>
                                </TableCell>
                             </TableRow>
                        )
                    })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
