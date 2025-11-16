

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
import { CheckCircle, Hourglass, Loader2, AlertTriangle } from "lucide-react";
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PaySubscriptionPage from "./pay/page";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const tiers = [
    {
      id: "starter",
      name: "Starter",
      price: 150,
      target: "2% to 5%",
      features: [
        "Basic Bot Access",
        "Standard Risk Settings",
        "Community Support",
      ],
    },
    {
      id: "growth",
      name: "Growth",
      price: 460,
      target: "6% to 17%",
      features: [
        "Full Bot Access",
        "Advanced Risk Controls",
        "Priority Support",
        "Paper Trading Mode",
      ],
    },
    {
      id: "max",
      name: "Max",
      price: 740,
      target: "18% to 39%",
      features: [
        "All Growth Features",
        "AI Strategy Insights",
        "Dedicated Account Manager",
        "Early Access to New Features",
      ],
    },
  ] as const;

type TierId = (typeof tiers)[number]['id'];

interface UserProfile {
    subscriptionStatus: 'inactive' | 'pending' | 'active' | 'rejected';
    planId: TierId;
}

function RejectedNotice() {
    return (
        <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Payment Rejected</AlertTitle>
            <AlertDescription>
                Unfortunately, there was an issue with your last payment submission. Please review your details and submit your payment proof again.
                <br />
                <span className="font-semibold mt-2 block">Warning: Your account will be blocked after 3 incorrect submission attempts.</span>
            </AlertDescription>
        </Alert>
    )
}

function PendingApproval() {
    return (
        <Card className="w-full max-w-2xl mx-auto mt-8 md:mt-16">
            <CardHeader className="items-center text-center">
                <Hourglass className="h-12 w-12 text-primary" />
                <CardTitle className="font-headline text-2xl">Subscription Pending</CardTitle>
                <CardDescription>
                    Your payment is currently being reviewed by our team. This usually takes less than 48 hours. You will be notified once your subscription is active.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                 <p className="text-muted-foreground">You can now access the dashboard with limited functionality. Full access will be granted upon approval.</p>
                 <Button asChild variant="outline" className="mt-4">
                    <Link href="/home">Go to Dashboard</Link>
                 </Button>
            </CardContent>
        </Card>
    );
}

function ActiveSubscription({ userProfile }: { userProfile: UserProfile }) {
    const currentPlan = tiers.find(t => t.id === userProfile.planId);
    const renewalDate = new Date();
    renewalDate.setFullYear(renewalDate.getFullYear() + 1);

    return (
        <div className="grid gap-6">
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Current Plan</CardTitle>
                    {currentPlan ? (
                         <CardDescription>Your current subscription is <span className="font-bold text-primary">{currentPlan.name}</span>. It renews on {renewalDate.toLocaleDateString()}.</CardDescription>
                    ) : (
                         <CardDescription>Loading your plan details...</CardDescription>
                    )}
                </CardHeader>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Payment History</CardTitle>
                    <CardDescription>A log of your subscription and fee payments.</CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No payment history available.
                        </TableCell>
                    </TableRow>
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
            
            <div className="mx-auto max-w-5xl text-center pt-8">
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
                Upgrade Your Plan
              </h2>
              <p className="mt-4 text-muted-foreground md:text-lg">
                Unlock more features and higher profit targets.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3 items-start">
              {tiers.map((tier) => (
                <Card
                  key={tier.name}
                  className={tier.id === userProfile.planId ? "border-2 border-primary shadow-2xl shadow-primary/20" : ""}
                >
                  <CardHeader className="text-center">
                    {tier.id === userProfile.planId && (
                      <div className="text-sm font-bold text-primary">CURRENT PLAN</div>
                    )}
                    <CardTitle className="font-headline text-2xl">{tier.name}</CardTitle>
                    <div className="text-4xl font-bold font-headline">${tier.price}<span className="text-sm font-normal text-muted-foreground">/year</span></div>
                    <p className="font-medium text-primary">Monthly Target: {tier.target}</p>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <ul className="flex-grow space-y-2">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full mt-4" variant={tier.id === userProfile.planId ? "default" : "outline"} asChild disabled={tier.id === userProfile.planId}>
                      <Link href={`/subscription/pay?plan=${tier.id}`}>{tier.id === userProfile.planId ? 'Current Plan' : 'Choose Plan'}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
      </div>
    )
}

export default function SubscriptionPage() {
    const { user, loading } = useUser();
    const router = useRouter();
    const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', user?.uid);
    
    const wasLastRejected = userProfile?.subscriptionStatus === 'rejected';

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);
    
    const isLoading = loading || profileLoading;

    if (isLoading) {
        return <DashboardShell title="Subscription & Billing"><div className="text-center">Loading...</div></DashboardShell>
    }

    if (!userProfile) {
         return <DashboardShell title="Subscription & Billing"><div className="text-center">Could not load user profile.</div></DashboardShell>
    }

    if (userProfile.subscriptionStatus === 'inactive' || userProfile.subscriptionStatus === 'rejected') {
        return (
            <DashboardShell title="Subscription">
                {wasLastRejected && <RejectedNotice />}
                <PaySubscriptionPage />
            </DashboardShell>
        );
    }
    
    return (
        <DashboardShell title="Subscription & Billing">
        {userProfile.subscriptionStatus === 'pending' && <PendingApproval />}
        {userProfile.subscriptionStatus === 'active' && <ActiveSubscription userProfile={userProfile} />}
        </DashboardShell>
    );
}
