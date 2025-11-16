

'use client';

import {
  Activity,
  ArrowUpRight,
  BadgePercent,
  Bot,
  CircleDollarSign,
  CreditCard,
  DollarSign,
  Link as LinkIcon,
  Users,
  AlertCircle,
  Zap,
  Target,
  Loader2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from 'next/link';

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
import { Progress } from "@/components/ui/progress";
import { DashboardShell } from "@/components/dashboard-shell";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useBotContext } from "@/context/bot-provider";
import { useUser, useFirestore } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const recentActivity: any[] = [];

const tiers = {
    starter: { name: "Starter", target: "2% to 5%", min: 2, max: 5 },
    growth: { name: "Growth", target: "6% to 17%", min: 6, max: 17 },
    max: { name: "Max", target: "18% to 39%", min: 18, max: 39 },
};

interface UserProfile {
    subscriptionStatus: 'active' | 'inactive' | 'pending' | 'rejected';
    planId?: 'starter' | 'growth' | 'max';
    connectedExchange?: {
        type: 'crypto' | 'forex' | 'stocks';
        name: string;
        icon?: string;
    }
    magnusInvestment?: number;
    magnusMonthlyTarget?: number;
}

interface Commission {
    id: string;
    amount: number;
}


function TradingSettings({ planId }: { planId?: keyof typeof tiers }) {
    const planDetails = planId && tiers[planId] ? tiers[planId] : { name: "Inactive", target: "0% to 0%", min: 0, max: 100 };
    const [monthlyTarget, setMonthlyTarget] = useState([planDetails.min, planDetails.max]);

    useEffect(() => {
        if (planId && tiers[planId]) {
            setMonthlyTarget([tiers[planId].min, tiers[planId].max]);
        }
    }, [planId]);


    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Trading Parameters</CardTitle>
                <CardDescription>
                    Define your investment and risk settings for the trading bot.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="investment">Investment Amount (USD)</Label>
                        <Input id="investment" placeholder="e.g. 10000" type="number" />
                        <p className="text-xs text-muted-foreground">The amount you want the bot to trade with.</p>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="monthly-target">Monthly Target Range (%)</Label>
                        <div className="py-4">
                            <Slider
                                id="monthly-target"
                                min={planDetails.min}
                                max={planDetails.max}
                                value={monthlyTarget}
                                onValueChange={setMonthlyTarget}
                                step={1}
                                minStepsBetweenThumbs={1}
                            />
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">{monthlyTarget[0]}%</span>
                            <span className="font-medium">{monthlyTarget[1]}%</span>
                        </div>
                         <p className="text-xs text-muted-foreground">Your '{planDetails.name}' plan allows: <span className="font-semibold">{planDetails.target}</span>.</p>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button disabled>Save Parameters</Button>
                </div>
            </CardContent>
        </Card>
    );
}

interface StatCardProps {
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
    progress?: number;
}

function StatCard({ title, value, icon: Icon, description, progress }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-headline">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {progress !== undefined && (
          <Progress value={progress} className="mt-2 h-2" />
        )}
      </CardContent>
    </Card>
  );
}

type ConnectedExchange = UserProfile['connectedExchange'];

function ConnectedMarket({ connectedExchange }: { connectedExchange?: ConnectedExchange }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Connected Market</CardTitle>
                <CardDescription>The exchange currently being traded by your bots.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex items-center justify-between space-x-4 p-4 rounded-lg bg-secondary">
                    {connectedExchange ? (
                        <>
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-12 w-12 bg-muted p-2">
                                    <AvatarFallback>{connectedExchange.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-lg font-bold leading-none">{connectedExchange.name}</p>
                                    <p className="text-sm text-muted-foreground capitalize">{connectedExchange.type} Exchange</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Badge variant="outline" className="text-green-500 border-green-500 text-sm">Connected</Badge>
                                <Button asChild variant="destructive">
                                    <Link href="/connect">Disconnect</Link>
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                             <div className="flex items-center space-x-4">
                                <Avatar className="h-12 w-12 bg-muted p-2">
                                    <AvatarFallback>?</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-lg font-bold leading-none">No Exchange Connected</p>
                                    <p className="text-sm text-muted-foreground">Please connect an exchange to begin.</p>
                                </div>
                            </div>
                             <div className="flex items-center gap-4">
                                <Badge variant="outline" className="text-red-500 border-red-500 text-sm">Not Connected</Badge>
                                <Button asChild variant="outline">
                                    <Link href="/connect">Connect <LinkIcon className="ml-2" /></Link>
                                </Button>
                             </div>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function ActivateSubscriptionAlert() {
  return (
    <Alert className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="font-headline">Activate Your Account</AlertTitle>
      <AlertDescription>
        Your account is inactive. Please go to the subscription page to choose a plan and activate your trading bots.
      </AlertDescription>
      <div className="mt-4">
        <Button asChild>
          <Link href="/subscription">
            Go to Subscription
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Alert>
  );
}

function HowMagnusWorks({ userProfile, profileLoading }: { userProfile?: UserProfile | null, profileLoading: boolean}) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [investment, setInvestment] = useState(10000);
  const [monthlyTarget, setMonthlyTarget] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (userProfile) {
        setInvestment(userProfile.magnusInvestment ?? 10000);
        setMonthlyTarget(userProfile.magnusMonthlyTarget ?? 10);
    }
  }, [userProfile]);

  const [currentProgress, setCurrentProgress] = useState(35); 

  const monthlyProfitGoal = useMemo(() => {
    return (investment * monthlyTarget) / 100;
  }, [investment, monthlyTarget]);

  const weeklyGoal = monthlyProfitGoal / 4;

  const weeks = useMemo(() => {
    return Array.from({ length: 4 }).map((_, i) => {
      const weekNumber = i + 1;
      const weekStart = (weekNumber - 1) * 25;
      const weekEnd = weekNumber * 25;
      const isCompleted = currentProgress >= weekEnd;
      const isActive = currentProgress >= weekStart && currentProgress < weekEnd;
      
      let weekProgress = 0;
      if (isCompleted) {
        weekProgress = 100;
      } else if (isActive) {
        weekProgress = ((currentProgress - weekStart) / 25) * 100;
      }

      return {
        week: weekNumber,
        targetAmount: weeklyGoal,
        progress: weekProgress,
        isCompleted,
        isActive,
      };
    });
  }, [weeklyGoal, currentProgress]);
  
  const handleSaveSettings = async () => {
    if (!firestore || !user?.uid) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not save settings. User not found.'
        });
        return;
    }

    setIsLoading(true);
    const userRef = doc(firestore, 'users', user.uid);
    const settingsData = {
        magnusInvestment: Number(investment),
        magnusMonthlyTarget: Number(monthlyTarget),
    };

    try {
        await updateDoc(userRef, settingsData)
        .catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: userRef.path,
                operation: 'update',
                requestResourceData: settingsData
            });
            errorEmitter.emit('permission-error', permissionError);
            throw serverError;
        });

        toast({
            title: 'Settings Saved',
            description: 'Your Magnus planner settings have been updated.'
        });
    } catch (error) {
        console.error("Failed to save settings: ", error);
        toast({
            variant: 'destructive',
            title: 'Save Failed',
            description: 'Could not save settings. Please check console for errors.'
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">How Magnus Works</CardTitle>
        <CardDescription>
          Based on your settings, Magnus divides your monthly profit goal into four weekly targets.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {profileLoading ? <div className="text-center">Loading settings...</div> : (
        <fieldset>
            <div className="grid md:grid-cols-3 gap-6 mb-6 items-end">
                <div className="space-y-2">
                    <Label htmlFor="investment-planner">Investment Amount (USD)</Label>
                    <Input 
                    id="investment-planner" 
                    type="number" 
                    value={investment} 
                    onChange={(e) => setInvestment(Number(e.target.value))}
                    placeholder="e.g. 10000"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="monthly-target-planner">Monthly Profit Target (%)</Label>
                    <div className="flex items-center gap-2">
                    <Input 
                        id="monthly-target-planner" 
                        type="number" 
                        value={monthlyTarget} 
                        onChange={(e) => setMonthlyTarget(Number(e.target.value))}
                        placeholder="e.g. 10"
                    />
                     <Button onClick={handleSaveSettings} disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Save'}
                    </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Total Monthly Profit Goal</Label>
                    <p className="text-3xl font-bold font-headline">${monthlyProfitGoal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {weeks.map((week) => (
                <Card key={week.week} className={week.isActive ? 'border-primary ring-1 ring-primary' : ''}>
                <CardHeader className="pb-4">
                    <CardDescription className="flex justify-between items-center">
                    <span>Week {week.week}</span>
                    {week.isActive && <Badge variant="default" className="bg-primary hover:bg-primary pulse-glow">Active</Badge>}
                    {week.isCompleted && <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800">Completed</Badge>}
                    </CardDescription>
                    <CardTitle className="font-headline text-3xl pt-2">
                    25%
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                        Target: ${week.targetAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <Progress value={week.progress} className="h-2" />
                </CardContent>
                </Card>
            ))}
            </div>
        </fieldset>
        )}
      </CardContent>
    </Card>
  );
}


export default function Dashboard() {
  const { isBotActive, setIsBotActive, isStartingUp } = useBotContext();
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', user?.uid);
  
  const commissionsQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, `users/${user.uid}/commissions`);
  }, [firestore, user?.uid]);
  const { data: commissions, loading: commissionsLoading } = useCollection<Commission>(commissionsQuery);

  const totalEarnings = useMemo(() => {
    if (!commissions) {
        return 0;
    }
    return commissions.reduce((sum, c) => sum + c.amount, 0);
  }, [commissions]);


  useEffect(() => {
    if (!userLoading && !user) {
        router.push('/login');
    }
  }, [user, userLoading, router]);


  if (userLoading || profileLoading || !userProfile || commissionsLoading) {
      return <DashboardShell title="Dashboard"><div className="text-center">Loading your experience...</div></DashboardShell>
  }

  const isInactive = userProfile.subscriptionStatus !== 'active';
  const botStatus = isInactive ? 'Inactive' : (isStartingUp ? 'Starting...' : (isBotActive ? 'Active' : 'Inactive'));
  
  return (
    <DashboardShell title={isInactive ? "Welcome" : "Dashboard"}>
      {userProfile.subscriptionStatus === 'inactive' && <ActivateSubscriptionAlert />}
      
      {userProfile.subscriptionStatus === 'active' ? (
        <fieldset disabled={isInactive} className="grid gap-4">
            <ConnectedMarket connectedExchange={userProfile.connectedExchange} />
            <TradingSettings planId={userProfile.planId} />
        </fieldset>
      ) : (
         <HowMagnusWorks userProfile={userProfile} profileLoading={profileLoading} />
      )}

      <fieldset disabled={isInactive} className="grid gap-4 mt-4">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <StatCard
            title="Total Equity"
            value="$0.00"
            description="0% from last month"
            icon={DollarSign}
          />
          <StatCard
            title="Monthly PnL"
            value="0%"
            description="Target: 0%"
            icon={BadgePercent}
          />
          <StatCard
            title="Progress to Target"
            value="0%"
            description="Monthly target: 0%"
            icon={BadgePercent}
            progress={0}
          />
          <Card className={cn("flex flex-col", (isBotActive && !isInactive) && "animated-grid")}>
              {(isBotActive && !isInactive) && <div className="scanner-line" style={{animationDuration: isBotActive ? '4s' : '10s' }}></div>}
              <CardHeader className="relative z-10">
                  <CardTitle className="text-lg font-headline flex items-center gap-2">
                    <Zap className={cn("transition-colors", (isBotActive || isStartingUp) ? "text-green-500" : "text-muted-foreground")} />
                    Trading Bots
                  </CardTitle>
                  <CardDescription>Enable or disable automated trading.</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 flex flex-col flex-1 justify-center items-center text-center">
                  <div className="flex items-center space-x-4">
                      <Switch id="bots-active" checked={isBotActive || isStartingUp} onCheckedChange={setIsBotActive} disabled={isStartingUp || isInactive}/>
                      <Label htmlFor="bots-active" className="text-xl font-bold font-headline">
                          {botStatus}
                      </Label>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                      {isInactive ? 'Activate your subscription to enable bots.' : (isBotActive ? 'Bots are currently active and trading.' : 'Bots are currently inactive.')}
                  </p>
              </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle className="text-lg font-headline">Recent Activity</CardTitle>
                <CardDescription>
                  An overview of the latest bot activities.
                </CardDescription>
              </div>
              <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/history">
                  View All
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivity.length === 0 ? (
                      <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                              No recent activity.
                          </TableCell>
                      </TableRow>
                  ) : (
                      recentActivity.map((activity, index) => (
                      <TableRow key={index}>
                          <TableCell className="font-medium">{activity.symbol}</TableCell>
                          <TableCell>
                              <Badge variant={activity.side === 'Buy' ? 'default' : 'destructive'} className={`bg-${activity.side === 'Buy' ? 'green' : 'red'}-500/20 text-${activity.side === 'Buy' ? 'green' : 'red'}-500 border-transparent`}>{activity.side}</Badge>
                          </TableCell>
                          <TableCell>{activity.size}</TableCell>
                          <TableCell className="text-right font-code">${activity.price.toLocaleString()}</TableCell>
                      </TableRow>
                  )))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle className="font-headline">Referral Program</CardTitle>
                  <CardDescription>Earn rewards by inviting new users.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                  <div className="p-4 rounded-lg bg-secondary/50 flex items-center justify-between">
                      <div>
                          <p className="text-sm text-muted-foreground">Your Referrals</p>
                          <p className="text-2xl font-bold font-headline">N/A</p>
                      </div>
                      <div>
                          <p className="text-sm text-muted-foreground">Rewards Earned</p>
                          <p className="text-2xl font-bold font-headline">${totalEarnings.toFixed(2)}</p>
                      </div>
                  </div>
                  <Button asChild>
                      <Link href="/referrals">Go to Referral Page <ArrowUpRight /></Link>
                  </Button>
              </CardContent>
          </Card>
        </div>
      </fieldset>
    </DashboardShell>
  );
}
