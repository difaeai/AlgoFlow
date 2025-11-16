
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  BotMessageSquare,
  Cable,
  CheckCircle,
  Combine,
  Gauge,
  BadgePercent,
  ShieldCheck,
  UserPlus,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { useFirestore } from "@/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { useEffect, useState } from "react";

interface Plan {
    id: string;
    name: string;
    price: number;
    target: string;
    features: string[];
    popular: boolean;
}

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
            href="#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Pricing
          </Link>
          <Link
            href="#faq"
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

function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 text-center bg-card">
       <div
        className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[10px_10px] [mask-image:linear-gradient(0deg,transparent,black)] dark:bg-grid-slate-100/[0.03] dark:[mask-image:linear-gradient(0deg,transparent,white)]"
        style={{ backgroundSize: '2rem 2rem'}}
      ></div>
      <div className="container mx-auto px-4 md:px-6 relative">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Automate Your Trades,
            <br />
            <span className="text-primary">Not Your Wallet.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            AlgoFlow offers a non-custodial trading bot that connects securely to your Binance or Exness account. You control your funds, we optimize your strategy.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" asChild className="shadow-lg shadow-primary/30">
              <Link href="/signup">
                Start Your Free Trial
                <Zap className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">
                Explore Features
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: <Cable className="h-10 w-10 text-primary" />,
      title: "Connect Your Exchange",
      description: "Securely link your Binance or Exness account using API keys. Your funds never leave your exchange, ensuring you always have full control.",
    },
    {
      icon: <Gauge className="h-10 w-10 text-primary" />,
      title: "Configure Your Strategy",
      description: "Choose a subscription tier that matches your goals and set your personal risk parameters. Our bots operate strictly within your defined limits.",
    },
    {
      icon: <BotMessageSquare className="h-10 w-10 text-primary" />,
      title: "Activate The Bots",
      description: "Our integrated 3-bot system—Analyzer, Decider, and Executor—works 24/7 to find opportunities and execute trades on your behalf.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
            Get Started in 3 Simple Steps
          </h2>
          <p className="mt-4 text-muted-foreground md:text-lg">
            Our platform is designed for an effortless setup, allowing you to start automated trading in minutes.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
                  {step.icon}
                </div>
                <CardTitle className="font-headline text-xl">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}


function Features() {
  const features = [
    {
      icon: <ShieldCheck className="h-8 w-8" />,
      title: "Absolutely Non-Custodial",
      description: "Your funds and assets remain in your own exchange account. We never have access to your capital, providing maximum security.",
    },
    {
      icon: <BotMessageSquare className="h-8 w-8" />,
      title: "3-Bot Trading System",
      description: "Our Analyzer, Decider, and Executor bots work in concert to deliver sophisticated, data-driven trading strategies around the clock.",
    },
    {
      icon: <Combine className="h-8 w-8" />,
      title: "Multi-Venue Support",
      description: "Connect to the world's leading exchanges for Crypto (Binance) and Forex (Exness), with more integrations coming soon.",
    },
    {
      icon: <Gauge className="h-8 w-8" />,
      title: "Advanced Risk Management",
      description: "You are in full control. Set your own risk tolerance with configurable stop-loss, daily drawdown limits, and max open positions.",
    },
    {
      icon: <BadgePercent className="h-8 w-8" />,
      title: "Fair Profit-Sharing Model",
      description: "We only succeed when you do. Our modest 3.5% fee is charged only on your profits, which you pay manually. No hidden charges.",
    },
    {
      icon: <UserPlus className="h-8 w-8" />,
      title: "Generous Referral Rewards",
      description: "Earn passive income by inviting new users to the AlgoFlow platform. Track your referrals and earnings directly within your dashboard.",
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 bg-card">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
            Powerful Features for Every Trader
          </h2>
          <p className="mt-4 text-muted-foreground md:text-lg">
            Everything you need for secure, automated, and intelligent trading, designed for both new and experienced users.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-headline text-lg font-semibold">{feature.title}</h3>
                <p className="mt-1 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const firestore = useFirestore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      if (!firestore) return;
      try {
        const plansQuery = query(collection(firestore, 'plans'));
        const querySnapshot = await getDocs(plansQuery);
        const plansData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
        setPlans(plansData);
      } catch (error) {
        console.error("Error fetching plans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [firestore]);


  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-muted-foreground md:text-lg">
            Simple, transparent pricing to fit your trading ambitions. All plans are billed annually.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create an account to pick a plan—payment instructions are shared inside the app after you sign up.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3 items-start">
          {loading ? (
            Array.from({length: 3}).map((_, i) => (
                <Card key={i} className="h-[450px] animate-pulse bg-muted"></Card>
            ))
          ) : !plans || plans.length === 0 ? (
            <p className="text-center text-muted-foreground col-span-3">No subscription plans are available at this time.</p>
          ) : (
            plans.map((tier) => (
            <Card
              key={tier.name}
              className={tier.popular ? "border-2 border-primary shadow-2xl shadow-primary/20" : ""}
            >
              <CardHeader className="text-center">
                {tier.popular && (
                  <div className="text-sm font-bold text-primary">MOST POPULAR</div>
                )}
                <CardTitle className="font-headline text-2xl">{tier.name}</CardTitle>
                <div className="text-4xl font-bold font-headline">${tier.price}<span className="text-sm font-normal text-muted-foreground">/year</span></div>
                <p className="font-medium text-primary">Monthly Target: {tier.target}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <ul className="flex-grow space-y-2">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-4" variant={tier.popular ? "default" : "outline"} asChild>
                  <Link href={`/signup?plan=${tier.id}`}>
                    Sign Up to Choose Plan
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )))}
        </div>
      </div>
    </section>
  );
}

function ReferralProgram() {
  return (
    <section id="referrals" className="py-20 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
              Earn More with Our Referral Program
            </h2>
            <p className="mt-4 text-muted-foreground md:text-lg">
              Love using AlgoFlow? Share it with your friends and earn rewards! Our referral program is a great way to generate an additional income stream.
            </p>
            <ul className="mt-6 space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 mt-1 text-primary" />
                <div>
                  <h4 className="font-semibold">Share Your Link</h4>
                  <p className="text-muted-foreground">Get your unique referral link from your dashboard and share it anywhere.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 mt-1 text-primary" />
                <div>
                  <h4 className="font-semibold">They Subscribe</h4>
                  <p className="text-muted-foreground">When someone signs up and subscribes using your link, you get rewarded.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 mt-1 text-primary" />
                <div>
                  <h4 className="font-semibold">You Earn</h4>
                  <p className="text-muted-foreground">Receive a commission for every successful referral. It's that simple!</p>
                </div>
              </li>
            </ul>
            <Button asChild className="mt-8">
              <Link href="/signup">Get Started & Refer</Link>
            </Button>
          </div>
          <div className="flex items-center justify-center">
            <UserPlus className="h-48 w-48 text-primary/20" />
          </div>
        </div>
      </div>
    </section>
  )
}

function FAQ() {
    const faqs = [
    {
      question: "What does non-custodial mean?",
      answer: "Non-custodial means we never hold your funds. Your money stays in your own exchange account (Binance or Exness), under your control. We only interact with your account via API keys to execute trades, and these keys are configured without withdrawal permissions for maximum security.",
    },
    {
      question: "How does the 3.5% fee on profits work?",
      answer: "We believe in a performance-based partnership. When your monthly profit target is met, we generate an invoice for just 3.5% of the realized profits for that month. You will be notified and can pay this fee manually off-platform. We never auto-debit fees from your account.",
    },
    {
      question: "How do I pay for my subscription?",
      answer: "To ensure maximum security and avoid linking your banking details, subscription payments are made manually to the company's designated account. After payment, you upload a proof of payment (like a screenshot or transaction ID) within the app. Our admin team will promptly review it and activate your subscription.",
    },
    {
      question: "What exchanges are supported?",
      answer: "Currently, we support Binance for cryptocurrency trading and Exness for forex trading. We are continuously working on integrating more of the world's top exchanges and brokers.",
    },
    {
      question: "Is my data and API information secure?",
      answer: "Absolutely. We take security very seriously. Your API keys are encrypted using industry-standard AES-256-GCM encryption and stored in a secure, isolated environment. We also strongly recommend enabling Two-Factor Authentication (2FA) on your AlgoFlow account for an extra layer of security.",
    },
  ];
  return (
    <section id="faq" className="py-20 md:py-28 bg-card">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="mt-12 mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index+1}`} key={index}>
                    <AccordionTrigger className="text-lg font-medium">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-base text-muted-foreground">
                    {faq.answer}
                    </AccordionContent>
                </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
     <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
            Ready to Automate Your Trading?
          </h2>
          <p className="mt-4 text-muted-foreground md:text-lg">
            Join AlgoFlow today and experience the future of non-custodial trading. Your funds, your control, our strategy.
          </p>
          <div className="mt-8">
             <Button size="lg" asChild className="shadow-lg shadow-primary/30">
              <Link href="/signup">
                Sign Up Now for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
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


export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Features />
        <Pricing />
        <ReferralProgram />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
