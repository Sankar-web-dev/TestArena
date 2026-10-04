import { requireRole } from "@/lib/require-role";
import { AccountSettings } from "@/components/settings/account-settings";

export default async function AdminSettingsPage() {
  const session = await requireRole(["ADMIN"]);

  return <AccountSettings user={session.user} />;
}
