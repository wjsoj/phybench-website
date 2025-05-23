import { auth } from "@/auth";
import CalculateScorePage from "@/components/admin/calculate-score";
import { NotPermitted } from "@/components/ui/not-permitted";
import { NotAuthorized } from "@/components/ui/not-authorized";

export default async function Page() {
  const session = await auth();
  if (!session) return <NotAuthorized />;

  if (session.user.role !== "admin") return <NotPermitted />;

  return (
    <div className=" h-screen max-h-screen overflow-clip pt-24">
      <CalculateScorePage />
    </div>
  );
}
