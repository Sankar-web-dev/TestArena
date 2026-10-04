import { ListChecksIcon } from "lucide-react";
import { ModulePlaceholder } from "@/components/common/module-placeholder";

export default function AdminQuestionsPage() {
  return (
    <ModulePlaceholder
      title="Questions"
      description="Question bank, verification, and imports"
      icon={<ListChecksIcon />}
    />
  );
}

