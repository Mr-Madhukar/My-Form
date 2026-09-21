import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logoImg from "~/public/logo.png";
import { api } from "~/trpc/server";
import {
  LayoutDashboard,
  Users,
  FileText,
  Activity,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { AdminHeaderNav } from "./_components/admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  let user: { id: string; fullName: string; email: string; role?: string } | null = null;

  try {
    user = await api.auth.me.query({});
  } catch {
    redirect("/login");
  }

  if (user?.role !== "admin") {
    redirect("/forms");
  }

  return (
    <div className="min-h-screen bg-[#070708] text-zinc-100 flex flex-col selection:bg-[#E8854A]/20 selection:text-[#E8854A]">
      {/* Top Banner & Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#0a0a0c]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
              <Image
                src={logoImg}
                alt="My Form"
                width={90}
                height={24}
                priority
                style={{ width: "auto", height: "auto" }}
                className="object-contain logo-img"
              />
            </Link>

            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold tracking-wide">
              <ShieldCheck className="size-3.5" />
              <span>SUPER ADMIN CONSOLE</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/forms"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-zinc-800/60 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Exit to Workspace</span>
            </Link>

            <AdminHeaderNav user={user} />
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto border-t border-zinc-900/80">
          <Link
            href="/admin"
            className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-zinc-300 hover:text-white border-b-2 border-transparent hover:border-[#E8854A] transition-colors whitespace-nowrap"
          >
            <LayoutDashboard className="size-3.5" />
            <span>Platform Overview</span>
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-zinc-300 hover:text-white border-b-2 border-transparent hover:border-[#E8854A] transition-colors whitespace-nowrap"
          >
            <Users className="size-3.5" />
            <span>Users & Access</span>
          </Link>
          <Link
            href="/admin/forms"
            className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-zinc-300 hover:text-white border-b-2 border-transparent hover:border-[#E8854A] transition-colors whitespace-nowrap"
          >
            <FileText className="size-3.5" />
            <span>Forms Moderation</span>
          </Link>
          <Link
            href="/admin/system"
            className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-zinc-300 hover:text-white border-b-2 border-transparent hover:border-[#E8854A] transition-colors whitespace-nowrap"
          >
            <Activity className="size-3.5" />
            <span>System Health</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
