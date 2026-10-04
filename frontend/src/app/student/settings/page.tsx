import { requireRole } from "@/lib/require-role";
import { AccountSettings } from "@/components/settings/account-settings";
import { StudentHeaderActions } from "@/components/student/student-header-actions";
import { ResponsiveContainer } from "@/components/common/responsive-container";

export default async function StudentSettingsPage() {
  const session = await requireRole(["STUDENT"]);

  return (
    <main className="min-h-screen bg-background">
      <ResponsiveContainer className="py-8">
        <div className="mb-6 flex justify-end">
          <StudentHeaderActions />
        </div>
        <AccountSettings user={session.user} />
      </ResponsiveContainer>
    </main>
  );
}
