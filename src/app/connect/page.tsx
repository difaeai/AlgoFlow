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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useUser, useFirestore } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";

type ExchangeType = "crypto" | "forex" | "stocks";

interface ConnectedExchange {
  type: ExchangeType;
  name: string;
}

interface BinancePermissions {
  spot: boolean;
  futures: boolean;
  margin: boolean;
  withdrawals: boolean;
}

interface BinanceSessionMeta {
  status?: "active" | "expired";
  email?: string | null;
  establishedAt?: unknown;
}

interface BinanceLink {
  label?: string;
  apiKey?: string;
  apiSecret?: string;
  permissions?: BinancePermissions;
  linkedAt?: unknown;
  session?: BinanceSessionMeta;
  metadata?: {
    apiKeyLastFour?: string;
  };
}

interface BinanceAccountSummary {
  accountType?: string;
  canTrade?: boolean;
  canWithdraw?: boolean;
  canDeposit?: boolean;
  updateTime?: number;
}

interface UserProfile {
  connectedExchange?: ConnectedExchange | null;
  binanceLink?: BinanceLink | null;
}

interface PermissionToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}

function PermissionToggle({
  label,
  description,
  checked,
  onCheckedChange,
}: PermissionToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border bg-card px-4 py-3">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

const setupSteps = [
  {
    title: "Verify Binance API Access",
    description: "Trigger a signed request from AlgoFlow to ensure your keys are active.",
    icon: ShieldCheck,
  },
  {
    title: "Create API Key",
    description: "Log in to Binance > API Management > Create AlgoFlow Bot key.",
    icon: KeyRound,
  },
  {
    title: "Enable Full Permissions",
    description: "Toggle Spot, Futures, Margin and Withdrawal permissions to ON.",
    icon: LockKeyhole,
  },
  {
    title: "Link to AlgoFlow",
    description: "Paste the keys below and authorize the bot for 24/7 execution.",
    icon: Bot,
  },
];

const safetyChecklist = [
  "Use IP whitelisting on Binance for maximum security.",
  "Rotate keys every 30 days to keep access fresh.",
  "Monitor the Account Activity stream inside the AlgoFlow dashboard.",
];

const defaultPermissions: BinancePermissions = {
  spot: true,
  futures: true,
  margin: true,
  withdrawals: true,
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

const formatUpdatedAt = (timestamp?: number) =>
  typeof timestamp === "number" && timestamp > 0
    ? new Date(timestamp).toLocaleString()
    : "No sync recorded";

function AlreadyConnectedAlert({ connectedExchangeName }: { connectedExchangeName: string }) {
  return (
    <Alert variant="default" className="bg-secondary">
      <ShieldCheck className="h-4 w-4" />
      <AlertTitle>{connectedExchangeName} Already Connected</AlertTitle>
      <AlertDescription>
        To connect a different account, disconnect the currently linked exchange first.
      </AlertDescription>
    </Alert>
  );
}

export default function ConnectPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>("users", user?.uid);
  const { toast } = useToast();

  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [passphrase, setPassphrase] = useState("AlgoFlow-Bot");
  const [permissions, setPermissions] = useState<BinancePermissions>({ ...defaultPermissions });
  const [acknowledged, setAcknowledged] = useState(false);
  const [binanceVerified, setBinanceVerified] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [binanceSessionEmail, setBinanceSessionEmail] = useState<string | null>(null);
  const [accountSummary, setAccountSummary] = useState<BinanceAccountSummary | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const storedApiKey = userProfile?.binanceLink?.apiKey ?? null;
  const storedApiSecret = userProfile?.binanceLink?.apiSecret ?? null;
  const hasStoredCredentials = Boolean(storedApiKey && storedApiSecret);

  const fetchWalletBalance = useCallback(
    async (apiKey: string, apiSecret: string) => {
      setWalletLoading(true);
      setWalletError(null);
      try {
        const response = await fetch("/api/binance/wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, apiSecret }),
        });
        const payload = (await response.json()) as { totalBalanceUSD?: number; error?: string };
        if (!response.ok) {
          throw new Error(payload?.error || "Unable to fetch wallet balance from Binance.");
        }
        setWalletBalance(
          typeof payload.totalBalanceUSD === "number" ? payload.totalBalanceUSD : null
        );
      } catch (error) {
        console.error("Error fetching Binance wallet balance:", error);
        setWalletBalance(null);
        setWalletError(
          error instanceof Error
            ? error.message
            : "Could not fetch live wallet balance. Check your API credentials."
        );
      } finally {
        setWalletLoading(false);
      }
    },
    []
  );

  const refreshStoredWalletBalance = useCallback(() => {
    if (storedApiKey && storedApiSecret) {
      void fetchWalletBalance(storedApiKey, storedApiSecret);
    }
  }, [fetchWalletBalance, storedApiKey, storedApiSecret]);

  const isConnected = useMemo(
    () => userProfile?.connectedExchange?.name === "binance",
    [userProfile?.connectedExchange?.name]
  );

  useEffect(() => {
    if (userProfile?.binanceLink) {
      setPassphrase(userProfile.binanceLink.label ?? "AlgoFlow-Bot");
      setPermissions({ ...defaultPermissions, ...(userProfile.binanceLink.permissions ?? {}) });
      setBinanceSessionEmail(userProfile.binanceLink.session?.email ?? user?.email ?? null);
    } else {
      setPermissions({ ...defaultPermissions });
      setBinanceVerified(false);
      setBinanceSessionEmail(null);
      setAccountSummary(null);
      setPassphrase("AlgoFlow-Bot");
      setWalletBalance(null);
      setWalletError(null);
    }
  }, [userProfile?.binanceLink, user?.email]);
  const verifyBinanceKeys = useCallback(
    async (
      keyToVerify: string,
      secretToVerify: string,
      { fetchWallet = false, silent = false }: { fetchWallet?: boolean; silent?: boolean } = {},
    ) => {
      const sanitizedKey = keyToVerify.trim();
      const sanitizedSecret = secretToVerify.trim();
      if (!sanitizedKey || !sanitizedSecret) {
        setVerificationError("Provide both API key and secret to contact Binance.");
        return false;
      }
      setVerificationLoading(true);
      setVerificationError(null);
      try {
        const response = await fetch("/api/binance/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: sanitizedKey, apiSecret: sanitizedSecret }),
        });
        const payload = (await response.json()) as {
          account?: BinanceAccountSummary;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload?.error || "Binance rejected the supplied credentials.");
        }
        setBinanceVerified(true);
        setBinanceSessionEmail(user?.email ?? null);
        setAccountSummary(payload.account ?? null);
        if (fetchWallet) {
          await fetchWalletBalance(sanitizedKey, sanitizedSecret);
        }
        if (!silent) {
          toast({
            title: "Binance verified",
            description: "Keys accepted by Binance via signed request.",
          });
        }
        return true;
      } catch (error) {
        console.error("Error verifying Binance keys:", error);
        const message =
          error instanceof Error ? error.message : "Unable to verify Binance credentials.";
        setBinanceVerified(false);
        setBinanceSessionEmail(null);
        setAccountSummary(null);
        if (!silent) {
          toast({
            variant: "destructive",
            title: "Verification failed",
            description: message,
          });
        }
        setVerificationError(message);
        if (fetchWallet) {
          setWalletBalance(null);
        }
        return false;
      } finally {
        setVerificationLoading(false);
      }
    },
    [fetchWalletBalance, toast, user?.email],
  );

  useEffect(() => {
    if (storedApiKey && storedApiSecret) {
      void verifyBinanceKeys(storedApiKey, storedApiSecret, { fetchWallet: true, silent: true });
    } else {
      setBinanceVerified(false);
      setAccountSummary(null);
      setWalletBalance(null);
      setWalletError(null);
    }
  }, [storedApiKey, storedApiSecret, verifyBinanceKeys]);

  const handleConnect = async () => {
    if (!firestore || !user?.uid) return false;
    const sanitizedKey = apiKey.trim();
    const sanitizedSecret = apiSecret.trim();
    if (!sanitizedKey || !sanitizedSecret) {
      return false;
    }
    const verified = await verifyBinanceKeys(sanitizedKey, sanitizedSecret, { silent: true });
    if (!verified) {
      return false;
    }
    const userRef = doc(firestore, "users", user.uid);
    try {
      await updateDoc(userRef, {
        connectedExchange: { type: "crypto", name: "binance" },
        binanceLink: {
          label: passphrase.trim() || "AlgoFlow-Bot",
          apiKey: sanitizedKey,
          apiSecret: sanitizedSecret,
          permissions,
          linkedAt: serverTimestamp(),
          session: {
            status: "active",
            email: binanceSessionEmail,
            establishedAt: serverTimestamp(),
          },
          metadata: {
            apiKeyLastFour: sanitizedKey.slice(-4),
          },
        },
      });
      toast({
        title: "Binance Connected",
        description: "AlgoFlow now has continuous access to your Binance account.",
      });
      await fetchWalletBalance(sanitizedKey, sanitizedSecret);
      setApiKey("");
      setApiSecret("");
      setAcknowledged(false);
      return true;
    } catch (error) {
      console.error("Error connecting exchange:", error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Could not connect to Binance. Please try again.",
      });
      return false;
    }
  };

  const handleDisconnect = async () => {
    if (!firestore || !user?.uid) return;
    const userRef = doc(firestore, "users", user.uid);
    try {
      await updateDoc(userRef, { connectedExchange: null, binanceLink: null });
      toast({
        title: "Exchange Disconnected",
        description: "Your Binance account has been disconnected.",
      });
      setPermissions({ ...defaultPermissions });
      setBinanceVerified(false);
      setBinanceSessionEmail(null);
      setAccountSummary(null);
      setPassphrase("AlgoFlow-Bot");
      setApiKey("");
      setApiSecret("");
      setAcknowledged(false);
      setWalletBalance(null);
      setWalletError(null);
      setWalletLoading(false);
      setVerificationError(null);
    } catch (error) {
      console.error("Error disconnecting exchange:", error);
      toast({
        variant: "destructive",
        title: "Disconnection Failed",
        description: "Could not disconnect Binance. Please try again.",
      });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!acknowledged) {
      toast({
        variant: "destructive",
        title: "Confirm Access",
        description: "Please acknowledge that AlgoFlow will have full control before connecting.",
      });
      return;
    }
    if (!Object.values(permissions).every(Boolean)) {
      toast({
        variant: "destructive",
        title: "Enable all permissions",
        description: "AlgoFlow needs spot, futures, margin, and withdrawal access to automate fully.",
      });
      return;
    }
    await handleConnect();
  };

  const connectButtonDisabled =
    !apiKey.trim() ||
    !apiSecret.trim() ||
    !acknowledged ||
    !Object.values(permissions).every(Boolean);

  if (userLoading || profileLoading) {
    return (
      <DashboardShell title="Connect Binance">
        <div className="text-center">Loading...</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Connect Binance">
      <div className="space-y-8">
        <Card className="overflow-hidden border-0 bg-gradient-to-r from-[#0c0f1c] via-[#131833] to-[#1f0f3d] text-white">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle className="font-headline text-2xl">Give AlgoFlow Full Binance Access</CardTitle>
                <CardDescription className="text-white/70">
                  Run signed Binance API checks without leaving AlgoFlow, authorize the bot, and let us manage spot, futures, margin, and withdrawals nonstop.
                </CardDescription>
              </div>
              <Badge
                variant="secondary"
                className={`text-sm ${
                  binanceVerified ? "bg-emerald-500 text-white" : "bg-white/20 text-white"
                }`}
              >
                {binanceVerified ? (isConnected ? "Linked" : "Verified") : "Verification Required"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-4">
              {setupSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="flex gap-4 rounded-xl bg-white/5 p-4">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
                        Step {index + 1}
                      </p>
                      <p className="text-base font-bold">{step.title}</p>
                      <p className="text-sm text-white/70">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {binanceVerified && isConnected && (
          <AlreadyConnectedAlert connectedExchangeName="Binance" />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Binance Account Connectivity</CardTitle>
            <CardDescription>
              Run Binance-signed checks directly from AlgoFlow to confirm your keys and unlock live wallet balances.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!binanceVerified ? (
              <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
                Paste your API key and secret below, then verify them using the controls in the next section. Once Binance accepts
                the signed request we display your connectivity state and live wallet balances here.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border bg-card px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Connectivity Status</p>
                  <p className="text-lg font-semibold">
                    {isConnected ? "Account linked to AlgoFlow" : "Keys verified - link to finish"}
                  </p>
                  {binanceSessionEmail && (
                    <p className="text-sm text-muted-foreground">Verified as: {binanceSessionEmail}</p>
                  )}
                  {accountSummary?.accountType && (
                    <p className="text-xs text-muted-foreground">
                      Account type: {accountSummary.accountType} · Last sync {formatUpdatedAt(accountSummary.updateTime)}
                    </p>
                  )}
                </div>
                <div className="rounded-lg border bg-card px-4 py-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Total wallet balance</span>
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-3xl font-bold">
                    {walletLoading
                      ? "Fetching live balance..."
                      : walletBalance !== null
                      ? formatCurrency(walletBalance)
                      : hasStoredCredentials
                      ? "Balance unavailable"
                      : "Provide API keys to view"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Live wallet totals refresh using Binance's signed API after each successful session.
                  </p>
                  {walletError && (
                    <p className="mt-2 text-sm text-destructive">{walletError}</p>
                  )}
                  {binanceVerified && hasStoredCredentials && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={refreshStoredWalletBalance}
                      disabled={walletLoading}
                    >
                      {walletLoading ? "Refreshing..." : "Refresh live balance"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Verify Binance Connectivity</CardTitle>
                <CardDescription>
                  Trigger Binance-signed API calls from AlgoFlow to confirm your keys before we store them.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <LockKeyhole className="h-10 w-10 rounded-full bg-background p-2 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">
                        {binanceVerified ? "Binance credentials verified" : "Action required: verify keys"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {binanceVerified
                          ? "Latest verification succeeded using Binance's signed API."
                          : "Provide your API key/secret below and run a signed request."}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={binanceVerified ? "default" : "secondary"}
                    className={binanceVerified ? "bg-emerald-500" : ""}
                  >
                    {binanceVerified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
                {binanceSessionEmail && (
                  <p className="text-xs text-muted-foreground">
                    Verified as <span className="font-semibold">{binanceSessionEmail}</span>
                  </p>
                )}
                <Alert variant="default" className="bg-muted">
                  <AlertTitle>Why verify from AlgoFlow?</AlertTitle>
                  <AlertDescription>
                    Successful verification proves the keys work before we persist them, preventing revoked scopes from halting automation.
                  </AlertDescription>
                </Alert>
                {verificationError && (
                  <Alert variant="destructive">
                    <AlertTitle>Verification failed</AlertTitle>
                    <AlertDescription>{verificationError}</AlertDescription>
                  </Alert>
                )}
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    className="flex-1 min-w-[200px]"
                    onClick={() => verifyBinanceKeys(apiKey, apiSecret)}
                    disabled={verificationLoading || !apiKey.trim() || !apiSecret.trim()}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    {verificationLoading ? "Contacting Binance..." : "Verify typed keys"}
                  </Button>
                  {hasStoredCredentials && storedApiKey && storedApiSecret && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 min-w-[200px]"
                      onClick={() => verifyBinanceKeys(storedApiKey, storedApiSecret, { fetchWallet: true })}
                      disabled={verificationLoading}
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      Refresh saved session
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Link Your Keys</CardTitle>
                <CardDescription>
                  Paste the API credentials generated on Binance right after login. Enabling all permissions ensures the bot can hedge, rebalance, and process withdrawals when profit targets are reached.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="api-label">API Label</Label>
                    <Input
                      id="api-label"
                      value={passphrase}
                      onChange={(event) => setPassphrase(event.target.value)}
                      placeholder="AlgoFlow-Bot"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <Input
                      id="api-key"
                      value={apiKey}
                      onChange={(event) => setApiKey(event.target.value)}
                      placeholder="Paste your Binance API key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api-secret">API Secret</Label>
                    <Input
                      id="api-secret"
                      type="password"
                      value={apiSecret}
                      onChange={(event) => setApiSecret(event.target.value)}
                      placeholder="Paste your Binance Secret"
                    />
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-muted-foreground">Permissions to enable</p>
                    <PermissionToggle
                      label="Spot & Margin Trading"
                      description="Allow AlgoFlow to open and close positions immediately."
                      checked={permissions.spot}
                      onCheckedChange={(value) => setPermissions((prev) => ({ ...prev, spot: value }))}
                    />
                    <PermissionToggle
                      label="Futures Trading"
                      description="Required for hedging and leveraged strategies."
                      checked={permissions.futures}
                      onCheckedChange={(value) => setPermissions((prev) => ({ ...prev, futures: value }))}
                    />
                    <PermissionToggle
                      label="Margin Transfers"
                      description="Move collateral between wallets automatically."
                      checked={permissions.margin}
                      onCheckedChange={(value) => setPermissions((prev) => ({ ...prev, margin: value }))}
                    />
                    <PermissionToggle
                      label="Withdrawals"
                      description="Let AlgoFlow sweep profits back to your secure wallet."
                      checked={permissions.withdrawals}
                      onCheckedChange={(value) => setPermissions((prev) => ({ ...prev, withdrawals: value }))}
                    />
                  </div>

                  <div className="flex items-center space-x-3 rounded-lg border bg-muted/30 p-4">
                    <Checkbox
                      id="acknowledge"
                      checked={acknowledged}
                      onCheckedChange={(value) => setAcknowledged(Boolean(value))}
                    />
                    <Label htmlFor="acknowledge" className="text-sm leading-tight text-muted-foreground">
                      I understand AlgoFlow will have continuous trading and withdrawal access to my Binance account.
                    </Label>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <Button type="submit" disabled={connectButtonDisabled} className="flex-1 min-w-[200px]">
                      {isConnected ? "Update Binance Keys" : "Connect Binance"}
                    </Button>
                    {isConnected && (
                      <Button type="button" variant="ghost" onClick={handleDisconnect}>
                        Disconnect
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Security Center</CardTitle>
                <CardDescription>We operate with bank-grade controls. Review the checklist below.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {safetyChecklist.map((item) => (
                  <div key={item} className="flex gap-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
                <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                  Need help? Email <span className="font-semibold text-foreground">security@algoflow.ai</span> for a live onboarding session.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Live Automation Preview</CardTitle>
                <CardDescription>See what the bot will do once access is granted.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">Latency-Optimized Entries</p>
                    <p className="text-xs text-muted-foreground">AlgoFlow listens to Binance WebSockets 24/7.</p>
                  </div>
                  <Zap className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">Biometric Verification</p>
                    <p className="text-xs text-muted-foreground">Every withdrawal is signed with device fingerprinting.</p>
                  </div>
                  <Fingerprint className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">Human Override</p>
                    <p className="text-xs text-muted-foreground">Pause automation instantly from the dashboard.</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
