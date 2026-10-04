import { getSession } from "@/lib/session";
import { StudentHeaderActions } from "@/components/student/student-header-actions";
import { ResponsiveContainer } from "@/components/common/responsive-container";
import { StudentDashboard } from "@/components/student/student-dashboard";

export default async function StudentPage() {
  const session = await getSession();

  return (
    <main className="min-h-screen bg-background">
      <ResponsiveContainer className="py-8">
        <div className="mb-6 flex justify-end">
          <StudentHeaderActions />
        </div>
        <StudentDashboard
          userName={session?.user.name ?? "Student"}
        />
      </ResponsiveContainer>
    </main>
  );
}
