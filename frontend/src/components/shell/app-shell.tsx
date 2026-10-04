"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MenuIcon } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getNavItems } from "./nav-items";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

interface AppShellUser {
  name: string;
  email: string;
  role: string;
  image?: string | null;
}

interface AppShellProps {
  user: AppShellUser;
  children: ReactNode;
}

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="flex items-center gap-2.5 px-5 py-5"
    >
      <Image
        src="/logo.jpg"
        alt="SAEC TestArena"
        width={32}
        height={32}
        className="size-8 rounded-lg object-cover"
      />
      <span className="font-heading text-base font-semibold tracking-tight text-navy-foreground">
        SAEC TestArena
      </span>
    </Link>
  );
}

function SidebarFooter({ user }: { user: AppShellUser }) {
  return (
    <div className="border-t border-white/10 p-3">
      <UserMenu user={user} />
    </div>
  );
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sections = getNavItems();
  const items = sections.flatMap((s) => s.items);
  const pageTitle =
    items.find((item) =>
      item.href === "/admin"
        ? pathname === item.href
        : pathname.startsWith(item.href),
    )?.title ?? "Dashboard";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar — dark navy */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-navy lg:flex">
        <Brand />
        <div className="flex-1 overflow-y-auto py-2">
          <SidebarNav sections={sections} />
        </div>
        <SidebarFooter user={user} />
      </aside>

      {/* Mobile top header */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b bg-navy px-4 text-navy-foreground lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-navy-foreground hover:bg-white/10 hover:text-white"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <MenuIcon />
          </Button>
          <SheetContent
            side="left"
            className="w-72 gap-0 border-r-0 bg-navy p-0 text-navy-foreground sm:max-w-72 [&>button]:text-navy-foreground/60"
          >
            <SheetTitle className="sr-only">
              Navigation
            </SheetTitle>
            <div className="flex h-full flex-col">
              <Brand onNavigate={() => setMobileOpen(false)} />
              <div className="flex-1 overflow-y-auto py-2">
                <SidebarNav
                  sections={sections}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
              <SidebarFooter user={user} />
            </div>
          </SheetContent>
        </Sheet>

        <h1 className="font-heading flex-1 text-sm font-semibold tracking-tight">
          {pageTitle}
        </h1>

        <Avatar className="size-7">
          {user.image && <AvatarImage src={user.image} alt="" />}
          <AvatarFallback className="bg-electric/20 text-[10px] font-semibold text-electric">
            {user.name
              .split(" ")
              .filter(Boolean)
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </header>

      {/* Main content */}
      <main className="min-w-0 flex-1 pt-14 lg:pl-64 lg:pt-0">
        <div
          key={pathname}
          className="animate-fade-in-up mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
        >
          {children}
        </div>
      </main>
    </div>
  );
}
