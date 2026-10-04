"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
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
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={isPending}
    >
      <LogOutIcon />
      {isPending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
