import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import DashboardSummary from "@/components/dashboardsummary";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) redirect("/auth/sign-in");

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-8">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
        Welcome back, {session.user.name}
      </h1>

      {/* Client component */}
      <DashboardSummary />
    </main>
  );
}
