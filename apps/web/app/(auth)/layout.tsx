import Link from "next/link";
import Image from "next/image";
import logoImg from "~/public/logo.png";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#080808] px-4 py-12 gap-7 overflow-hidden" suppressHydrationWarning>
      {/* Atmospheric glow */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-144 w-xl rounded-full bg-[#E8854A] opacity-[0.10] blur-[140px]" />
        <div className="absolute -bottom-48 -right-40 h-136 w-136 rounded-full bg-[#3a5a7a] opacity-[0.06] blur-[150px]" />
      </div>

      {/* Wordmark */}
      <Link href="/" className="flex items-center transition-opacity duration-300 hover:opacity-80">
        <Image src={logoImg} alt="My Form" width={120} height={30} className="object-contain logo-img" />
      </Link>

      <main className="w-full max-w-md">{children}</main>

      <p className="max-w-xs text-center text-xs leading-relaxed text-[#A3A3A3]">
        By clicking continue, you agree to our{" "}
        <Link
          href="/terms"
          className="underline decoration-white/20 underline-offset-2 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-[#F2F2F2]"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="underline decoration-white/20 underline-offset-2 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-[#F2F2F2]"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
