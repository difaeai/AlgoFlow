

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { Loader2, CheckCircle, Upload, File as FileIcon, AlertTriangle, Copy } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


const tiers = [
  { id: 'starter', name: 'Starter', price: 150 },
  { id: 'growth', name: 'Growth', price: 460 },
  { id: 'max', name: 'Max', price: 740 },
];

const btcWalletAddress = "1Zcj65PM3Jyd7ZHxZzS8zcsRQomGCZ4TH";

function SuccessScreen() {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-4 py-12">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <CardTitle className="font-headline text-2xl">Payment Submitted!</CardTitle>
        <CardDescription className="max-w-md">
            Your payment submission has been received. Our team will review it and activate your account within 48 hours. Redirecting you...
        </CardDescription>
    </div>
  )
}

function PaySubscriptionFormComponent() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [selectedPlanId, setSelectedPlanId] = useState(searchParams.get('plan') || 'growth');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const selectedPlan = tiers.find((tier) => tier.id === selectedPlanId);
  
  useEffect(() => {
    if (selectedPlan) {
      setPaidAmount(selectedPlan.price);
    } else {
      setPaidAmount('');
    }
  }, [selectedPlanId, selectedPlan]);

  useEffect(() => {
    if (isSubmitted) {
        const timer = setTimeout(() => {
            router.push('/subscription');
        }, 3000);
        return () => clearTimeout(timer);
    }
  }, [isSubmitted, router]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        if (selectedFile.size > 1 * 1024 * 1024) { // 1MB limit
            setFileError("File size must be under 1MB.");
            setFile(null);
            setFileDataUrl(null);
        } else {
            setFileError(null);
            setFile(selectedFile);
            // Convert file to data URL
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                setFileDataUrl(loadEvent.target?.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(btcWalletAddress);
    toast({
        title: "Copied to Clipboard",
        description: "BTC wallet address copied.",
    });
}
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || !selectedPlan || !paidAmount || !fileDataUrl) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please complete all steps, including uploading a payment proof, before submitting.',
      });
      return;
    }

    setIsLoading(true);

    try {
        const subscriptionData = {
            userId: user.uid,
            planId: selectedPlan.id,
            exchange: 'bitcoin', // Unified payment method
            status: 'pending_approval' as const,
            paymentProofUrl: fileDataUrl, // Save the data URL directly
            paidAmount: Number(paidAmount),
            createdAt: serverTimestamp(),
        };

        await addDoc(collection(firestore, 'subscriptions'), subscriptionData);

        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, { subscriptionStatus: 'pending' });
        
        setIsSubmitted(true);

    } catch (error) {
      console.error('Submission failed:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <Card className="w-full max-w-2xl mx-auto">
        {isSubmitted ? (
            <CardContent>
                <SuccessScreen />
            </CardContent>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="font-headline text-3xl">Subscribe to a Plan</CardTitle>
              <CardDescription>
                Complete your subscription by making a manual payment and uploading proof of the transaction.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="grid gap-6">
                
                <div className="grid gap-2">
                    <Label className="font-semibold">Step 1: Make Your Payment</Label>
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Important: BTC Only</AlertTitle>
                        <AlertDescription>
                            We only accept Bitcoin (BTC) for payments. Please send the BTC equivalent of your subscription amount to the address below.
                        </AlertDescription>
                    </Alert>
                    <div className="rounded-md border bg-card-foreground/5 dark:bg-card-foreground/10 p-6 flex flex-col items-center gap-4">
                        <p className="text-sm font-semibold text-center">Send BTC to the address below:</p>
                        <div className="flex w-full max-w-md items-center space-x-2">
                            <Input type="text" readOnly value={btcWalletAddress} className="font-code text-center" />
                            <Button type="button" variant="outline" size="icon" onClick={copyToClipboard}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <fieldset className="grid gap-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="plan" className="font-semibold">Step 2: Confirm Your Plan</Label>
                            <Select value={selectedPlanId} onValueChange={setSelectedPlanId} required>
                            <SelectTrigger id="plan">
                                <SelectValue placeholder="Choose a subscription plan" />
                            </SelectTrigger>
                            <SelectContent>
                                {tiers.map((tier) => (
                                <SelectItem key={tier.id} value={tier.id}>
                                    {tier.name} - ${tier.price}/year
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="amount-paid">Amount to Pay (USD)</Label>
                            <Input
                            id="amount-paid"
                            type="number"
                            placeholder="e.g., 460"
                            value={paidAmount}
                            readOnly
                            className="bg-muted"
                            />
                        </div>
                    </div>
                </fieldset>

                <fieldset disabled={!selectedPlanId} className="grid gap-2">
                    <Label htmlFor="payment-proof" className="font-semibold">Step 3: Upload Payment Proof</Label>
                    <Input
                        id="payment-proof"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <Button type="button" variant="outline" asChild>
                        <Label htmlFor="payment-proof" className="cursor-pointer">
                            <Upload className="mr-2" />
                            {file ? 'Change image...' : 'Choose an image...'}
                        </Label>
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        Please upload a clear screenshot of your transaction (max 1MB).
                    </p>
                    {file && !fileError && (
                        <div className="flex items-center gap-2 p-2 rounded-md bg-secondary text-sm">
                            <FileIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium truncate">{file.name}</span>
                        </div>
                    )}
                    {fileError && (
                        <Alert variant="destructive" className="text-xs">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{fileError}</AlertDescription>
                        </Alert>
                    )}
                </fieldset>

              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading || !fileDataUrl || !!fileError}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Submitting...' : 'Submit for Approval'}
                </Button>
              </CardFooter>
            </form>
          </>
        )}
      </Card>
  )
}

export default function PaySubscriptionPage() {
    return (
        <Suspense fallback={<div className="text-center">Loading...</div>}>
            <PaySubscriptionFormComponent />
        </Suspense>
    )
}
