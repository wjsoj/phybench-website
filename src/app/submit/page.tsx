import { auth } from "@/auth";
import SubmitPage from "@/components/main-submit";
import { NotAuthorized } from "@/components/ui/not-authorized";

export default async function Page() {
  const session = await auth();
  if (!session) return <NotAuthorized />;

  return (
    <div>
      <SubmitPage />
    </div>
  );
}
