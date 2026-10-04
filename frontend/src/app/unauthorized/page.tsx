import Link from "next/link";
import { ShieldXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/session";
import { roleHome } from "@/lib/roles";

export default async function UnauthorizedPage() {
  const session = await getSession();
  const homeHref = session
    ? roleHome(session.user.role)
    : "/login";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <div className="rounded-full bg-destructive/10 p-3 text-destructive">
            <ShieldXIcon className="size-6" />
          </div>
          <div className="space-y-1">
            <h1 className="font-heading text-xl font-semibold">
              Access restricted
            </h1>
            <p className="text-sm text-muted-foreground">
              Your account doesn&apos;t have permission to view
              this area.
            </p>
          </div>
          <div className="flex gap-2">
            <Button render={<Link href={homeHref} />}>
              {session ? "Go to my dashboard" : "Sign in"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
