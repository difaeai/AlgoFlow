
'use client';

import Link from "next/link";
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
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { useRouter } from "next/navigation";


export default function AdminSignupPage() {
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSignUp = async (e) => {
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

            const newReferralCode = Buffer.from(user.uid).toString('base64').substring(0, 8);

            await setDoc(doc(firestore, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: user.email?.split('@')[0],
                photoURL: user.photoURL,
                referralCode: newReferralCode, 
                referrerId: null,
                upline: [],
                subscriptionStatus: "active", // Admins are active by default
                createdAt: serverTimestamp(),
                isAdmin: true, // Set admin flag
            });

            router.push('/admin');

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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <Logo className="h-8 w-8 text-primary" />
          </Link>
          <CardTitle className="font-headline text-2xl">Create Admin Account</CardTitle>
          <CardDescription>
            Create the primary administrator account for AlgoFlow.
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
                  placeholder="admin@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
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
               {error && <p className="text-destructive text-sm text-center">{error}</p>}
              <Button type="submit" className="w-full">
                Create Admin Account
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
    </div>
  );
}
