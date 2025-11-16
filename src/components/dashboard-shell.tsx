
'use client';

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Home,
  LineChart,
  Package,
  Package2,
  Settings,
  ShoppingCart,
  Users,
  Wallet,
  AreaChart,
  Briefcase,
  FileText,
  BadgePercent,
  UserPlus,
  Shield,
  Bot,
  Badge as BadgeIcon,
  Link as LinkIcon,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
import { useAuth, useUser } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { signOut } from "firebase/auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/connect", icon: LinkIcon, label: "Connect" },
  { href: "/magnus", icon: Zap, label: "MAGNUS" },
  { href: "/history", icon: FileText, label: "Profit History" },
  { href: "/subscription", icon: BadgeIcon, label: "Subscription" },
  { href: "/referrals", icon: UserPlus, label: "Referrals" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

function SidebarNav({ isSubscriptionActive }: { isSubscriptionActive: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const isAllowedWhenInactive = href === '/home' || href === '/subscription';
        const isDisabled = !isSubscriptionActive && !isAllowedWhenInactive;
        
        return (
          <Link
            key={label}
            href={isDisabled ? '#' : href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
              pathname === href ? "bg-muted text-primary" : "text-muted-foreground hover:text-primary",
              isDisabled && "cursor-not-allowed opacity-50"
            )}
            aria-disabled={isDisabled}
            onClick={(e) => isDisabled && e.preventDefault()}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        )
      })}
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
            <AvatarImage src="https://picsum.photos/seed/user-avatar/40/40" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/settings')}>Settings</DropdownMenuItem>
        <DropdownMenuItem>Support</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface UserProfile {
    subscriptionStatus: 'active' | 'inactive' | 'pending' | 'rejected';
}

export function DashboardShell({
  children,
  title,
  titleComponent,
}: {
  children: React.ReactNode;
  title?: string;
  titleComponent?: React.ReactNode;
}) {

  const { user } = useUser();
  const { data: userProfile } = useDoc<UserProfile>('users', user?.uid);
  const isSubscriptionActive = userProfile?.subscriptionStatus === 'active';

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-sidebar md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Logo className="h-6 w-6 text-sidebar-primary" />
              <span className="font-headline text-xl text-sidebar-foreground">AlgoFlow</span>
            </Link>
          </div>
          <div className="flex-1">
            <SidebarNav isSubscriptionActive={isSubscriptionActive} />
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
                <Link href="/" className="flex items-center gap-2 font-semibold">
                  <Logo className="h-6 w-6 text-sidebar-primary" />
                  <span className="font-headline text-xl text-sidebar-foreground">AlgoFlow</span>
                </Link>
              </div>
              <SidebarNav isSubscriptionActive={isSubscriptionActive} />
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            {titleComponent ? titleComponent : <h1 className="text-xl font-semibold font-headline">{title}</h1>}
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
