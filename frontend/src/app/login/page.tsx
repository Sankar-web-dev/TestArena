import { Suspense } from "react";
import { redirectIfAuthenticated } from "@/lib/require-role";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  // Already signed in → send straight to role dashboard.
  await redirectIfAuthenticated();

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
