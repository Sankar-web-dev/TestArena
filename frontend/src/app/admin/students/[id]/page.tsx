import { UserDetail } from "@/components/users/user-detail";

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <UserDetail
      basePath="/admin/students"
      userId={id}
    />
  );
}
