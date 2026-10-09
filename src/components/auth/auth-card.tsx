import type { ReactNode } from "react";
import Link from "next/link";

export function AuthDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-[#E4E0D3]" />
      <span className="text-xs font-medium text-[#98A2B3]">or</span>
      <div className="h-px flex-1 bg-[#E4E0D3]" />
    </div>
  );
}

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#1E2A3A]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col md:flex-row">
        {/* LEFT: brand panel with mesh-gradient blobs on cream */}
        <aside className="relative overflow-hidden md:min-h-screen md:w-[44%] lg:w-[46%]">
          <div aria-hidden className="absolute inset-0">
            <div
              className="absolute -left-28 -top-28 h-[26rem] w-[26rem] rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(14,116,144,0.20), transparent 70%)",
              }}
            />
            <div
              className="absolute -right-32 top-1/4 h-[30rem] w-[30rem] rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(217,164,65,0.18), transparent 70%)",
              }}
            />
            <div
              className="absolute -bottom-32 left-1/4 h-[26rem] w-[26rem] rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(59,110,180,0.16), transparent 70%)",
              }}
            />
          </div>
          <div className="relative px-6 py-7 md:px-12 md:pt-28">
            <Link
              href="/"
              className="font-display text-[26px] font-bold tracking-tight md:text-[30px]"
            >
              MS Jobs
            </Link>
            <p className="mt-2 text-sm text-[#667085] md:hidden">
              Stop job hunting. Start matchmaking.
            </p>
            <div className="hidden md:block">
              <p className="mt-10 font-display text-[40px] font-bold leading-[1.25]">
                Stop job hunting.
                <br />
                Start matchmaking.
              </p>
              <div className="mt-10 flex gap-10">
                <div>
                  <p className="font-display text-2xl font-bold">2,400+</p>
                  <p className="mt-0.5 text-[13px] text-[#667085]">jobs tracked weekly</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold">6</p>
                  <p className="mt-0.5 text-[13px] text-[#667085]">ATS sources live</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT: white form card on the cream page background */}
        <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md rounded-[20px] border border-[#E4E0D3] bg-white px-8 py-8 shadow-[0px_8px_24px_0px_rgba(28,41,59,0.10)] sm:px-9 sm:py-9">
            <h1 className="font-display text-[26px] font-bold tracking-tight">{title}</h1>
            {subtitle ? <p className="mt-1.5 text-sm text-[#667085]">{subtitle}</p> : null}
            <div className="mt-6">{children}</div>
            {footer ? <div className="mt-6 space-y-5">{footer}</div> : null}
          </div>
        </main>
      </div>
    </div>
  );
}
