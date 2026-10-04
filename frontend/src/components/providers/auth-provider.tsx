"use client";

import { createContext, useContext } from "react";
import { authClient } from "@/lib/auth-client";

const AuthContext = createContext<{
  user: typeof authClient.$Infer.Session.user | null;
  isPending: boolean;
}>({
  user: null,
  isPending: true,
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, isPending } = authClient.useSession();

  return (
    <AuthContext.Provider
      value={{
        user: data?.user ?? null,
        isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
