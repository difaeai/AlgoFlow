
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!firestore) {
        setError("Firebase is not initialized. Please try again later.");
        setLoading(false);
        return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user is an admin
      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().isAdmin === true) {
        router.push('/admin');
      } else {
        router.push('/home');
      }

    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setError("Invalid email or password. Please try again.");
      } else {
        setError("An unexpected error occurred. Please try again later.");
        console.error(error); // Log other errors for debugging
      }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-background p-4 pt-20">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-2xl">
              Welcome Back
            </CardTitle>
            <CardDescription>
              Enter your credentials to access your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
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
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="#"
                      className="ml-auto inline-block text-sm underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-destructive text-sm text-center">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="underline">
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
