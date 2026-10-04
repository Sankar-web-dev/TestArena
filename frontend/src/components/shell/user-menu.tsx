"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronUpIcon,
  LogOutIcon,
  SettingsIcon,
} from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuUser {
  name: string;
  email: string;
  role: string;
  image?: string | null;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu({ user }: { user: UserMenuUser }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);
    const { error } = await authClient.signOut();

    if (error) {
      setIsPending(false);
      toast.error(error.message ?? "Logout failed");
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/10" />
        }
      >
        <Avatar className="size-8">
          {user.image && <AvatarImage src={user.image} alt="" />}
          <AvatarFallback className="bg-electric/20 text-xs font-semibold text-electric">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-navy-foreground">
            {user.name}
          </p>
          <p className="truncate text-xs text-navy-foreground/60">
            {user.email}
          </p>
        </div>
        <ChevronUpIcon className="size-4 shrink-0 text-navy-foreground/50" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-56"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-1">
            <span className="truncate text-sm font-medium">
              {user.name}
            </span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
            <Badge
              variant="outline"
              className="mt-1 w-fit border-electric/30 bg-electric/10 text-electric"
            >
              {user.role}
            </Badge>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<Link href="/admin/settings" />}
        >
          <SettingsIcon />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isPending}
        >
          <LogOutIcon />
          {isPending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
