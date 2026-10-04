import { getSession } from "@/lib/session";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  const session = await getSession();

  return (
    <AdminDashboard
      userName={session?.user.name ?? "Admin"}
    />
  );
}
