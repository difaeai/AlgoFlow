
'use client';

import { useState, useEffect } from "react";
import { AdminShell } from "../_components/admin-shell";
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
import { useFirestore, useUser } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useDoc } from "@/firebase/firestore/use-doc";

interface AppSettings {
    paymentDetails?: string;
}

interface UserProfile {
    isAdmin?: boolean;
}

export default function AdminSettingsPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { data: userProfile } = useDoc<UserProfile>('users', user?.uid);
    const { toast } = useToast();
    
    const [paymentDetails, setPaymentDetails] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!firestore) return;
            const settingsRef = doc(firestore, 'app', 'settings');
            const docSnap = await getDoc(settingsRef);
            if (docSnap.exists()) {
                setPaymentDetails(docSnap.data()?.paymentDetails || '');
            }
        };
        fetchSettings();
    }, [firestore]);

    const handleSave = async () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to the database.' });
            return;
        }
        setIsLoading(true);
        try {
            const settingsRef = doc(firestore, 'app', 'settings');
            await setDoc(settingsRef, { paymentDetails }, { merge: true });
            toast({ title: 'Settings Saved', description: 'Your changes have been saved successfully.' });
        } catch (error) {
            console.error("Error saving settings:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save settings.' });
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <AdminShell title="Application Settings">
      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Manage API keys for third-party services. (This is a read-only example).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="binance-api">Binance API Key</Label>
              <Input
                id="binance-api"
                defaultValue="******************"
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exness-api">Exness API Key</Label>
              <Input
                id="exness-api"
                defaultValue="******************"
                readOnly
              />
            </div>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>
                    The account details where users should send manual payments.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="account-details">Bank Account Details / Crypto Address</Label>
                    <Input 
                        id="account-details" 
                        placeholder="Enter payment details for users" 
                        value={paymentDetails}
                        onChange={(e) => setPaymentDetails(e.target.value)}
                    />
                </div>
            </CardContent>
        </Card>
        <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isLoading || !userProfile?.isAdmin}>
                {isLoading ? "Saving..." : "Save Settings"}
            </Button>
        </div>
      </div>
    </AdminShell>
  );
}
