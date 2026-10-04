"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AtSignIcon,
  CircleAlertIcon,
  KeyRoundIcon,
  Loader2Icon,
  MailIcon,
  UserRoundIcon,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { apiRequest, ApiError } from "@/lib/api/client";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const USERNAME_RE = /^[a-z0-9_.-]{3,30}$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

interface SettingsUser {
  name: string;
  email: string;
  username?: string | null;
  image?: string | null;
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Alert variant="destructive">
      <CircleAlertIcon />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function AccountSettings({ user }: { user: SettingsUser }) {
  // ---------- username ----------
  const [username, setUsername] = useState(user.username ?? "");
  const [usernameError, setUsernameError] =
    useState<string | null>(null);
  const [usernamePending, setUsernamePending] = useState(false);

  async function handleUsernameSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = username.trim().toLowerCase();

    if (!USERNAME_RE.test(next)) {
      setUsernameError(
        "Username must be 3-30 chars: lowercase letters, numbers, _ . -",
      );
      return;
    }
    if (next === (user.username ?? "")) {
      setUsernameError("That's already your username");
      return;
    }

    setUsernameError(null);
    setUsernamePending(true);

    try {
      // Better Auth exposes username via user.updateUser
      // (additionalFields.username has input: true).
      await apiRequest("/api/auth/update-user", {
        method: "POST",
        body: { username: next },
      });
      toast.success("Username updated.");
      setUsername(next);
    } catch (err) {
      setUsernameError(
        err instanceof ApiError
          ? err.message
          : "Could not update username. It may already be taken.",
      );
    } finally {
      setUsernamePending(false);
    }
  }

  // ---------- password ----------
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] =
    useState<string | null>(null);
  const [passwordPending, setPasswordPending] = useState(false);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!PASSWORD_RE.test(next)) {
      setPasswordError(
        "New password must be 8+ chars with a letter and a number",
      );
      return;
    }
    if (next !== confirm) {
      setPasswordError("Passwords do not match");
      return;
    }

    setPasswordError(null);
    setPasswordPending(true);

    const { error } = await authClient.changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: true,
    });

    setPasswordPending(false);

    if (error) {
      setPasswordError(
        error.message ??
          "Could not change password. Check your current password.",
      );
      return;
    }

    toast.success("Password changed. Other devices were signed out.");
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Account Settings"
        description="Manage your username and password."
      />

      {/* Profile info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your sign-in details. Email can only be changed by
            an administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
            <p className="flex items-center gap-2">
              <UserRoundIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="font-medium">{user.name}</span>
            </p>
            <p className="flex items-center gap-2">
              <MailIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-muted-foreground">
                {user.email}
              </span>
            </p>
          </div>

          <form
            onSubmit={handleUsernameSubmit}
            className="space-y-3"
          >
            <FormError message={usernameError} />
            <div className="space-y-1.5">
              <Label htmlFor="as-username">Username</Label>
              <div className="relative">
                <AtSignIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="as-username"
                  className="pl-9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your.name"
                  autoComplete="username"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                3-30 chars: lowercase letters, numbers, _ . -
              </p>
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={usernamePending}
            >
              {usernamePending && (
                <Loader2Icon className="animate-spin" />
              )}
              Save username
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRoundIcon className="size-4 text-muted-foreground" />
            Change Password
          </CardTitle>
          <CardDescription>
            Changing your password signs out every other
            device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handlePasswordSubmit}
            className="space-y-4"
          >
            <FormError message={passwordError} />

            <div className="space-y-1.5">
              <Label htmlFor="as-current">
                Current password
              </Label>
              <Input
                id="as-current"
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="as-new">New password</Label>
                <Input
                  id="as-new"
                  type="password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="as-confirm">
                  Confirm password
                </Label>
                <Input
                  id="as-confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Min 8 characters with at least one letter and
              one number.
            </p>

            <Button
              type="submit"
              size="sm"
              disabled={passwordPending}
            >
              {passwordPending && (
                <Loader2Icon className="animate-spin" />
              )}
              Change password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
