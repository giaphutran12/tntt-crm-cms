import { AdminShell } from "@/components/admin/shell";
import { AuthUnavailablePanel } from "@/components/admin/access-panels";
import { getAuthAvailability, requireAuthenticatedAppUser } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authAvailability = await getAuthAvailability();

  if (authAvailability.status === "unavailable") {
    return <AuthUnavailablePanel />;
  }

  const currentUser = await requireAuthenticatedAppUser("/admin");

  if (!currentUser) {
    return <AuthUnavailablePanel />;
  }

  return <AdminShell user={currentUser}>{children}</AdminShell>;
}
