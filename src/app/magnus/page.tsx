
'use client';

import { DashboardShell } from "@/components/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignalsContent from "../signals/page";
import StrategiesContent from "../strategies/page";
import PositionsContent from "../positions/page";
import { useBotContext } from "@/context/bot-provider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Target, Loader2, Timer } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

interface UserProfile {
    magnusInvestment?: number;
    magnusMonthlyTarget?: number;
    subscriptionStatus?: string;
    magnusAnalysisStartDate?: { seconds: number };
}


function MagnusPlanner() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', user?.uid);

  const [investment, setInvestment] = useState(10000);
  const [monthlyTarget, setMonthlyTarget] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (userProfile) {
        setInvestment(userProfile.magnusInvestment ?? 10000);
        setMonthlyTarget(userProfile.magnusMonthlyTarget ?? 10);
    }
  }, [userProfile]);

  // Example progress: 35 means we are 35% of the way through the month's total goal.
  // This would come from a live data source in a real app.
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
        // Calculate progress within the current week's 25% chunk
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
        <fieldset disabled={userProfile?.subscriptionStatus !== 'active'}>
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

const MagnusCountdown = ({ analysisStartDate }: { analysisStartDate: { seconds: number } }) => {
    const calculateTimeLeft = () => {
        const fifteenDaysInMillis = 15 * 24 * 60 * 60 * 1000;
        const endTime = (analysisStartDate.seconds * 1000) + fifteenDaysInMillis;
        const now = new Date().getTime();
        const difference = endTime - now;

        if (difference <= 0) {
            return null;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        return { days, hours, minutes, seconds };
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [analysisStartDate]);

    if (!timeLeft) {
        return null; // Or a message indicating analysis is complete
    }

    return (
        <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Timer className="h-4 w-4" />
            <span>Analysis running: {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</span>
        </div>
    );
};


export default function MagnusPage() {
  const { isBotActive, setIsBotActive, isStartingUp } = useBotContext();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', user?.uid);
  const { toast } = useToast();

  const isAnalyzing = useMemo(() => {
      if (!userProfile?.magnusAnalysisStartDate) return false;
      const fifteenDaysInMillis = 15 * 24 * 60 * 60 * 1000;
      const endTime = (userProfile.magnusAnalysisStartDate.seconds * 1000) + fifteenDaysInMillis;
      return new Date().getTime() < endTime;
  }, [userProfile]);


  const handleToggle = async (checked: boolean) => {
    if (checked) {
      // Logic for turning the bot ON
      if (!isAnalyzing && !userProfile?.magnusAnalysisStartDate) {
        // If not analyzing and no start date is set, show confirmation to start fresh.
        setShowConfirmation(true);
      } else {
        // If already analyzing or analysis is complete, just activate.
        setIsBotActive(true);
      }
    } else {
      // Logic for turning the bot OFF
      setIsBotActive(false);
      // If the bot is turned off during the analysis phase, reset the timer.
      if (isAnalyzing && firestore && user?.uid) {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, { magnusAnalysisStartDate: null });
        toast({ title: "Analysis Stopped", description: "The Magnus analysis period has been reset."});
      }
    }
  };

  const handleConfirmStart = async () => {
    if (!firestore || !user?.uid) {
        toast({ variant: 'destructive', title: "Error", description: "Cannot start bot, user not found." });
        setShowConfirmation(false);
        return;
    }
    
    // Set the analysis start date in Firestore
    const userRef = doc(firestore, 'users', user.uid);
    await updateDoc(userRef, { magnusAnalysisStartDate: serverTimestamp() });
    toast({ title: "Analysis Period Started", description: "The 15-day data analysis has begun."});

    // Activate the bot
    setIsBotActive(true);
    setShowConfirmation(false);
  };
  
  const botStatus = isStartingUp ? 'Starting...' : (isBotActive ? 'Active' : 'Inactive');

  const titleComponent = (
    <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold font-headline">MAGNUS</h1>
        <div className="flex items-center space-x-2">
            <Switch 
                id="bots-active-magnus" 
                checked={isBotActive || isStartingUp} 
                onCheckedChange={handleToggle} 
                disabled={isStartingUp}
            />
            <Label htmlFor="bots-active-magnus" className="text-sm font-medium">
                {isAnalyzing ? 'Analyzing...' : botStatus}
            </Label>
        </div>
        {isAnalyzing && userProfile?.magnusAnalysisStartDate && <MagnusCountdown analysisStartDate={userProfile.magnusAnalysisStartDate} />}
    </div>
  );

  if (profileLoading) {
    return <DashboardShell title="MAGNUS"><div className="text-center">Loading...</div></DashboardShell>
  }

  return (
    <>
    <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Are you ready to start Magnus?</AlertDialogTitle>
            <AlertDialogDescription>
            This will begin the 15-day data analysis period. Please confirm that you have set your desired investment amount in the Magnus Planner section.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStart}>OK, Start Analysis</AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    <DashboardShell titleComponent={titleComponent}>
      <MagnusPlanner />
      <Tabs defaultValue="signals">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="signals">Data Analyzer</TabsTrigger>
          <TabsTrigger value="strategies">Decider</TabsTrigger>
          <TabsTrigger value="positions">Executor</TabsTrigger>
        </TabsList>
        <TabsContent value="signals">
            <SignalsContent />
        </TabsContent>
        <TabsContent value="strategies">
            <StrategiesContent />
        </TabsContent>
        <TabsContent value="positions">
            <PositionsContent />
        </TabsContent>
      </Tabs>
    </DashboardShell>
    </>
  );
}

    