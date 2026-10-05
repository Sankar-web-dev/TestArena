"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { roleHome } from "@/lib/roles";
import type { Role } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { CircleAlertIcon } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  function validate() {
    const errors: { email?: string; password?: string } =
      {};

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validate()) {
      return;
    }

    setIsPending(true);

    try {
      const { data, error: authError } =
        await authClient.signIn.email({
          email: email.trim(),
          password,
        });

      if (authError) {
        setError(
          authError.status === 401 ||
            authError.code === "INVALID_EMAIL_OR_PASSWORD"
            ? "Invalid email or password"
            : (authError.message ?? "Login failed"),
        );
        setIsPending(false);
        return;
      }

      const role = (data?.user as { role?: Role } | undefined)
        ?.role;

      const next = searchParams.get("next");
      const destination =
        next && next.startsWith("/")
          ? next
          : role
            ? roleHome(role)
            : "/";

      router.push(destination);
      router.refresh();
      // If the destination route redirects back to /login (e.g.
      // auth check fails), this component stays mounted — don't
      // leave the button spinning forever.
      setIsPending(false);
    } catch {
      setError(
        "Cannot reach the server. Check your connection and try again.",
      );
      setIsPending(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* Branding panel — dark navy, desktop only */}
      <div className="relative hidden overflow-hidden bg-navy text-navy-foreground lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="bg-dot-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative flex items-center gap-2">
          <Image
            src="/logo.jpg"
            alt="SAEC TestArena"
            width={40}
            height={40}
            className="size-10 rounded-lg object-cover"
          />
          <span className="font-heading text-lg font-semibold tracking-tight">
            SAEC TestArena
          </span>
        </div>

        <div className="relative space-y-4">
          <h2 className="font-heading max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Compete. Measure. Rank.
          </h2>
          <p className="max-w-md text-sm text-navy-foreground/70">
            A precision examination platform — timed contests,
            verified question banks, server-side scoring, and
            live leaderboards.
          </p>
          <div className="flex gap-6 pt-4">
            {[
              { label: "Timed exams", value: "500+" },
              { label: "Auto-scored", value: "100%" },
              { label: "Server-graded", value: "Secure" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="numeric font-heading text-xl font-semibold text-electric">
                  {stat.value}
                </p>
                <p className="text-xs text-navy-foreground/60">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-navy-foreground/50">
          © 2026 SAEC TestArena · Department of CSE
        </p>
      </div>

      {/* Form column */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <Image
              src="/logo.jpg"
              alt="SAEC TestArena"
              width={40}
              height={40}
              className="size-10 rounded-lg object-cover"
            />
            <span className="font-heading text-lg font-semibold tracking-tight">
              SAEC TestArena
            </span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Sign in
              </CardTitle>
              <CardDescription>
                Enter your credentials to access your exams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
                noValidate
              >
                {error && (
                  <Alert variant="destructive">
                    <CircleAlertIcon />
                    <AlertDescription>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!fieldErrors.email}
                    disabled={isPending}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-destructive">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      aria-invalid={!!fieldErrors.password}
                      disabled={isPending}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((v) => !v)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOffIcon className="size-4" />
                      ) : (
                        <EyeIcon className="size-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-destructive">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-electric text-electric-foreground transition-all hover:bg-electric/90 glow-electric"
                >
                  {isPending ? (
                    <>
                      <Loader2Icon className="animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Access is restricted to registered participants.
          </p>
        </div>
      </div>
    </main>
  );
}
