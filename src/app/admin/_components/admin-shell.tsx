
'use client';

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Home,
  Users,
  Settings,
  CreditCard,
  BadgePercent,
  FileCog,
  Package,
  Bot,
  UserPlus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where } from "firebase/firestore";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { useDoc } from "@/firebase/firestore/use-doc";

interface Subscription {
  id: string;
  status: string;
}

interface UserProfile {
    isAdmin?: boolean;
}

const NAV_ITEMS = [
  { href: "/admin", icon: Home, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/subscriptions", icon: CreditCard, label: "Subscriptions", notificationKey: 'pendingSubscriptions' },
  { href: "/admin/plans", icon: Package, label: "Plans" },
  { href: "/admin/referrals", icon: UserPlus, label: "Referrals" },
  { href: "/admin/auto-fee-bot", icon: Bot, label: "Auto-Fee Bot" },
  { href: "/admin/settings", icon: FileCog, label: "App Settings" },
];

function SidebarNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {NAV_ITEMS.map(({ href, icon: Icon, label, notificationKey }) => (
        <Link
          key={label}
          href={href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
            pathname === href
              ? "bg-muted text-primary"
              : "text-muted-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
          {notificationKey === 'pendingSubscriptions' && pendingCount > 0 && (
            <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
              {pendingCount}
            </Badge>
          )}
        </Link>
      ))}
    </nav>
  );
}

function UserMenu() {
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="rounded-full">
          <Avatar>
            <AvatarImage src="https://picsum.photos/seed/admin-avatar/40/40" />
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/admin/settings')}>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AdminShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { data: userProfile } = useDoc<UserProfile>('users', user?.uid);

  const pendingSubsQuery = useMemo(() => {
    if (!firestore || !userProfile?.isAdmin) return null;
    return query(collection(firestore, 'subscriptions'), where('status', '==', 'pending_approval'));
  }, [firestore, userProfile?.isAdmin]);

  const { data: pendingSubscriptions } = useCollection<Subscription>(pendingSubsQuery);
  const pendingCount = pendingSubscriptions?.length || 0;

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-sidebar md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/admin" className="flex items-center gap-2 font-semibold">
              <Logo className="h-6 w-6 text-sidebar-primary" />
              <span className="font-headline text-xl text-sidebar-foreground">AlgoFlow <span className="text-sm text-muted-foreground">(Admin)</span></span>
            </Link>
          </div>
          <div className="flex-1">
            <SidebarNav pendingCount={pendingCount} />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Home className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-sidebar">
              <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/admin" className="flex items-center gap-2 font-semibold">
                  <Logo className="h-6 w-6 text-sidebar-primary" />
                  <span className="font-headline text-xl text-sidebar-foreground">AlgoFlow <span className="text-sm text-muted-foreground">(Admin)</span></span>
                </Link>
              </div>
              <SidebarNav pendingCount={pendingCount} />
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <h1 className="text-xl font-semibold font-headline">{title}</h1>
          </div>
          <UserMenu />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
