
'use client';

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useUser, useFirestore } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

type PlanTier = 'starter' | 'growth' | 'max';

interface UserProfile {
    desiredInvestment?: number;
    monthlyTarget?: number;
    riskMode?: 'conservative' | 'balanced' | 'aggressive';
    dailyDrawdown?: number;
    paperMode?: boolean;
    subscriptionStatus?: string;
    planId?: PlanTier;
}

const tiers: Record<PlanTier, { name: string; targetRange: string }> = {
    starter: { name: "Starter", targetRange: "2% to 5%" },
    growth: { name: "Growth", targetRange: "6% to 17%" },
    max: { name: "Max", targetRange: "18% to 39%" },
};

export default function SettingsPage() {
    const { user, loading: userLoading } = useUser();
    const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', user?.uid);
    const firestore = useFirestore();
    const { toast } = useToast();

    const [investment, setInvestment] = useState<number | string>('');
    const [monthlyTarget, setMonthlyTarget] = useState<number | string>('');
    const [riskMode, setRiskMode] = useState<string>('');
    const [dailyDrawdown, setDailyDrawdown] = useState<number | string>('');
    const [paperMode, setPaperMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setInvestment(userProfile.desiredInvestment || '');
            setMonthlyTarget(userProfile.monthlyTarget || '');
            setRiskMode(userProfile.riskMode || 'balanced');
            setDailyDrawdown(userProfile.dailyDrawdown || '');
            setPaperMode(userProfile.paperMode || false);
        }
    }, [userProfile]);

    const handleSave = async () => {
        if (!firestore || !user?.uid) return;
        setIsSaving(true);
        try {
            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, {
                desiredInvestment: Number(investment),
                monthlyTarget: Number(monthlyTarget),
                riskMode,
                dailyDrawdown: Number(dailyDrawdown),
                paperMode,
            });
            toast({ title: "Settings Saved", description: "Your trading parameters have been updated." });
        } catch (error) {
            console.error("Error saving settings:", error);
            toast({ variant: 'destructive', title: "Save Failed", description: "Could not save your settings." });
        } finally {
            setIsSaving(false);
        }
    };

    const loading = userLoading || profileLoading;
    const planDetails = userProfile?.planId ? tiers[userProfile.planId] : undefined;
    const isInactive = userProfile?.subscriptionStatus !== 'active';

  return (
    <DashboardShell title="Settings">
      <div className="grid gap-6 max-w-4xl mx-auto">
        {loading ? (
            <Card><CardContent className="p-6 text-center">Loading settings...</CardContent></Card>
        ) : (
        <fieldset disabled={isInactive || isSaving}>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Trading Parameters</CardTitle>
                    <CardDescription>
                        Define your investment and risk settings. These are constrained by your subscription tier.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="investment">Desired Investment (USD)</Label>
                            <Input id="investment" placeholder="e.g. 10000" type="number" value={investment} onChange={(e) => setInvestment(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="monthly-target">Monthly Target (%)</Label>
                            <Input id="monthly-target" placeholder="e.g. 15" type="number" value={monthlyTarget} onChange={(e) => setMonthlyTarget(e.target.value)} />
                            <p className="text-xs text-muted-foreground">
                                {planDetails ? `Your '${planDetails.name}' plan allows ${planDetails.targetRange}.` : 'Your plan does not define a target range.'}
                            </p>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="risk-mode">Risk Mode</Label>
                            <Select value={riskMode} onValueChange={setRiskMode}>
                                <SelectTrigger id="risk-mode">
                                    <SelectValue placeholder="Select risk mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="conservative">Conservative</SelectItem>
                                    <SelectItem value="balanced">Balanced</SelectItem>
                                    <SelectItem value="aggressive">Aggressive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="daily-drawdown">Daily Drawdown (%)</Label>
                            <Input id="daily-drawdown" placeholder="e.g. 5" type="number" value={dailyDrawdown} onChange={(e) => setDailyDrawdown(e.target.value)} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Paper Trading</CardTitle>
                    <CardDescription>
                        Enable paper trading to test strategies without using real funds.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2">
                        <Switch id="paper-mode" checked={paperMode} onCheckedChange={setPaperMode} />
                        <Label htmlFor="paper-mode">Enable Paper Mode</Label>
                    </div>
                </CardContent>
            </Card>
            
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving || isInactive}>
                    {isSaving ? "Saving..." : "Save Settings"}
                </Button>
            </div>
        </fieldset>
        )}
      </div>
    </DashboardShell>
  );
}
