import { auth } from "@/auth";
// import BrowsePage from "@/components/submit/main-browse";
import AdminBrowsePage from "@/components/admin/admin-browse";
import { NotAuthorized } from "@/components/ui/not-authorized";

export default async function Page({
  params,
}: {
  params: Promise<{ page: number }>;
}) {
  const session = await auth();
  if (!session) return <NotAuthorized />;
  const { page } = await params;
  return (
    <div className="w-screen py-24">
      <AdminBrowsePage currentPage={page} />
    </div>
  );
}
