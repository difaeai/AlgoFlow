
'use client';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck } from "lucide-react";
import { useUser, useFirestore } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";


interface UserProfile {
    connectedExchange?: {
        type: 'crypto' | 'forex' | 'stocks';
        name: string;
    }
}

function AlreadyConnectedAlert({ connectedExchangeName }: { connectedExchangeName: string }) {
    return (
        <Alert variant="default" className="bg-secondary">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>{connectedExchangeName} Already Connected</AlertTitle>
            <AlertDescription>
                You already have an exchange connected to your profile. To connect a different one, please disconnect the current exchange first.
            </AlertDescription>
        </Alert>
    )
}

function CryptoConnect({ connectedExchange, onConnect, onDisconnect }) {
    const isEnabled = !connectedExchange || connectedExchange?.type === 'crypto';
    const [exchangeName, setExchangeName] = useState('binance');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Connect Crypto Exchange</CardTitle>
        <CardDescription>
          Select your exchange and enter your API Key and Secret. Ensure
          withdrawal permissions are disabled.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectedExchange && !isEnabled && <AlreadyConnectedAlert connectedExchangeName={connectedExchange.name} />}
        <fieldset disabled={!isEnabled} className="space-y-4">
            <div className="space-y-2">
            <Label htmlFor="crypto-exchange">Exchange</Label>
            <Select defaultValue="binance" onValueChange={setExchangeName}>
                <SelectTrigger id="crypto-exchange">
                <SelectValue placeholder="Select an exchange" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="binance">Binance</SelectItem>
                <SelectItem value="coinbase">Coinbase</SelectItem>
                <SelectItem value="kucoin">KuCoin</SelectItem>
                <SelectItem value="kraken">Kraken</SelectItem>
                </SelectContent>
            </Select>
            </div>
            <div className="space-y-2">
            <Label htmlFor="crypto-api-key">API Key</Label>
            <Input id="crypto-api-key" placeholder="Your API Key" defaultValue={connectedExchange?.type === 'crypto' ? '**************' : ''}/>
            </div>
            <div className="space-y-2">
            <Label htmlFor="crypto-api-secret">API Secret</Label>
            <Input id="crypto-api-secret" type="password" placeholder="Your API Secret" defaultValue={connectedExchange?.type === 'crypto' ? '**************' : ''} />
            </div>
            <Button onClick={() => {
                if (connectedExchange) {
                    onDisconnect();
                } else {
                    onConnect({ type: 'crypto', name: exchangeName })
                }
            }}>
                {connectedExchange?.type === 'crypto' ? 'Disconnect' : 'Connect'}
            </Button>
        </fieldset>
      </CardContent>
    </Card>
  );
}

function ForexConnect({ connectedExchange, onConnect, onDisconnect }) {
    const isEnabled = !connectedExchange || connectedExchange?.type === 'forex';
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Connect Forex Broker</CardTitle>
          <CardDescription>
            This is a placeholder. Functionality is not yet implemented.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectedExchange && !isEnabled && <AlreadyConnectedAlert connectedExchangeName={connectedExchange.name} />}
          <fieldset disabled={true} className="space-y-4 opacity-50">
            <div className="space-y-2">
                <Label htmlFor="forex-broker">Broker</Label>
                <Select defaultValue="exness">
                    <SelectTrigger id="forex-broker">
                        <SelectValue placeholder="Select a broker" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="exness">Exness</SelectItem>
                        <SelectItem value="oanda">OANDA</SelectItem>
                        <SelectItem value="forex.com">Forex.com</SelectItem>
                        <SelectItem value="ig">IG</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          <div className="space-y-2">
            <Label htmlFor="forex-account-id">Account ID</Label>
            <Input id="forex-account-id" placeholder="Your Account ID" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="forex-password">Password</Label>
            <Input id="forex-password" type="password" placeholder="Your Password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="forex-server">Server</Label>
            <Input id="forex-server" placeholder="e.g., Exness-Real7" />
          </div>
          <Button>Connect</Button>
        </fieldset>
        </CardContent>
      </Card>
    );
  }

function StockConnect({ connectedExchange, onConnect, onDisconnect }) {
    const isEnabled = !connectedExchange || connectedExchange?.type === 'stocks';
    return (
        <Card>
        <CardHeader>
            <CardTitle className="font-headline">Connect Stock Broker</CardTitle>
            <CardDescription>
            This is a placeholder. Functionality is not yet implemented.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
        {connectedExchange && !isEnabled && <AlreadyConnectedAlert connectedExchangeName={connectedExchange.name} />}
         <fieldset disabled={true} className="space-y-4 opacity-50">
            <div className="space-y-2">
                <Label htmlFor="stock-broker">Broker</Label>
                <Select defaultValue="interactive-brokers">
                    <SelectTrigger id="stock-broker">
                        <SelectValue placeholder="Select a broker" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="interactive-brokers">Interactive Brokers</SelectItem>
                        <SelectItem value="etrade">E*TRADE</SelectItem>
                        <SelectItem value="td-ameritrade">TD Ameritrade</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="stock-api-key">API Key</Label>
                <Input id="stock-api-key" placeholder="Your API Key" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="stock-api-secret">API Secret</Label>
                <Input id="stock-api-secret" type="password" placeholder="Your API Secret" />
            </div>
            <Button>Connect</Button>
         </fieldset>
        </CardContent>
        </Card>
    );
}

export default function ConnectPage() {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();
    const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', user?.uid);
    const { toast } = useToast();

    const handleConnect = async (exchangeData: UserProfile['connectedExchange']) => {
        if (!firestore || !user?.uid) return;
        const userRef = doc(firestore, 'users', user.uid);
        try {
            await updateDoc(userRef, { connectedExchange: exchangeData });
            toast({
                title: "Exchange Connected",
                description: `Successfully connected to ${exchangeData?.name}.`,
            });
        } catch (error) {
            console.error("Error connecting exchange:", error);
            toast({ variant: "destructive", title: "Connection Failed", description: "Could not connect to the exchange." });
        }
    };

    const handleDisconnect = async () => {
         if (!firestore || !user?.uid) return;
        const userRef = doc(firestore, 'users', user.uid);
        try {
            await updateDoc(userRef, { connectedExchange: null });
            toast({
                title: "Exchange Disconnected",
                description: `Your exchange has been disconnected.`,
            });
        } catch (error) {
            console.error("Error disconnecting exchange:", error);
            toast({ variant: "destructive", title: "Disconnection Failed", description: "Could not disconnect the exchange." });
        }
    }

    if (userLoading || profileLoading) {
        return <DashboardShell title="Connect an Exchange"><div className="text-center">Loading...</div></DashboardShell>
    }

  return (
    <DashboardShell title="Connect an Exchange">
      <Tabs defaultValue="crypto" className="w-full max-w-2xl mx-auto">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="crypto">Crypto</TabsTrigger>
          <TabsTrigger value="forex">Forex</TabsTrigger>
          <TabsTrigger value="stocks">Stocks</TabsTrigger>
        </TabsList>
        <TabsContent value="crypto">
          <CryptoConnect 
            connectedExchange={userProfile?.connectedExchange}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            />
        </TabsContent>
        <TabsContent value="forex">
          <ForexConnect 
            connectedExchange={userProfile?.connectedExchange} 
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            />
        </TabsContent>
        <TabsContent value="stocks">
          <StockConnect 
            connectedExchange={userProfile?.connectedExchange}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
           />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
