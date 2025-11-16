
'use client';

import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, where, serverTimestamp } from "firebase/firestore";
import { useState, Suspense, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary" />
          <span className="font-headline text-xl font-bold text-foreground">
            AlgoFlow
          </span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Features
          </Link>
          <Link
            href="/#pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Pricing
          </Link>
          <Link
            href="/#faq"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            FAQ
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">
              Sign Up <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="py-8 bg-card">
       <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center gap-2">
           <Logo className="h-6 w-6 text-primary" />
          <span className="font-headline text-lg font-bold">AlgoFlow</span>
        </div>
        <p className="text-sm text-muted-foreground mt-4 md:mt-0">© {new Date().getFullYear()} AlgoFlow. All rights reserved.</p>
       </div>
    </footer>
  )
}

function SignupFormComponent() {
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const refCode = searchParams.get('ref');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (!firestore) {
            setError("Database service is not available. Please try again later.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            let referrerId: string | undefined = undefined;
            const upline: string[] = [];

            if (refCode) {
                const usersRef = collection(firestore, 'users');
                const q = query(usersRef, where("referralCode", "==", refCode));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const referrerDoc = querySnapshot.docs[0];
                    referrerId = referrerDoc.id;
                    const referrerData = referrerDoc.data();
                    upline.push(referrerId);
                    if (referrerData.upline) {
                        upline.push(...referrerData.upline.slice(0, 4));
                    }
                } else {
                    console.warn("Referrer code not found:", refCode);
                }
            }

            // A simple way to generate a unique referral code.
            const newReferralCode = Buffer.from(user.uid).toString('base64').substring(0, 8);

            await setDoc(doc(firestore, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: user.email?.split('@')[0],
                photoURL: user.photoURL,
                referralCode: newReferralCode, 
                referrerId: referrerId || null,
                upline: upline,
                subscriptionStatus: "inactive",
                createdAt: serverTimestamp(),
            });

            router.push('/home');

        } catch (error: any) {
             if (error.code === 'auth/email-already-in-use') {
                setError("This email address is already in use.");
            } else if (error.code === 'auth/weak-password') {
                setError("The password is too weak. Please use at least 6 characters.");
            }
            else {
                setError("Failed to create an account. Please try again.");
                console.error(error);
            }
        }
    };
    
    return (
        <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
              <CardTitle className="font-headline text-2xl">Create an Account</CardTitle>
              <CardDescription>
                Join AlgoFlow and start automating your trades today.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground px-1">
                      Use the same email you use for your exchange (e.g., Binance, Exness).
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                        id="password" 
                        type="password" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input 
                        id="confirm-password" 
                        type="password" 
                        required 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  {refCode && (
                    <div className="text-sm text-center text-muted-foreground p-2 bg-secondary rounded-md">
                        Referred by: {refCode}
                    </div>
                  )}
                  {error && <p className="text-destructive text-sm text-center">{error}</p>}
                  <Button type="submit" className="w-full">
                    Create Account
                  </Button>
                </div>
              </form>
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="underline">
                  Login
                </Link>
              </div>
            </CardContent>
          </Card>
    )
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center bg-background p-4 pt-20">
            <Suspense fallback={<div>Loading...</div>}>
                <SignupFormComponent />
            </Suspense>
        </main>
      <Footer />
    </div>
  );
}
