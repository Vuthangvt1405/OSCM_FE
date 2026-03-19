import Link from "next/link";
import { Compass, Home, Search, ArrowRight } from "lucide-react";
import { SiteHeader } from "./components/Header";

const quickLinks = [
  { href: "/search", label: "Search", icon: Search },
  { href: "/", label: "Home", icon: Home },
];

export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] overflow-auto bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_42%,#f8fafc_100%)] text-slate-950">
      <section className="relative isolate mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.22),transparent_60%)]" />
        <div className="absolute left-1/2 top-28 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(125,211,252,0.28),rgba(255,255,255,0))] blur-3xl" />

        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(380px,0.98fr)] lg:items-center xl:gap-12">
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-sm font-semibold tracking-[0.18em] text-sky-700 uppercase shadow-sm backdrop-blur">
              <Compass className="h-4 w-4" />
              404 error
            </div>

            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-sky-600">
              Navigation recovery
            </p>
            <h1 className="mt-4 max-w-[10ch] text-5xl font-black leading-[0.95] tracking-[-0.06em] text-slate-950 sm:text-6xl xl:text-7xl">
              You’ve wandered off the mapped route.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              The page may be outdated, the link may have moved, or the address
              may be incorrect. Use the links below to get back to a useful
              starting point.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-500"
              >
                <Home className="h-4 w-4" />
                Back to home
              </Link>
              <Link
                href="/social"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-500"
              >
                Go to social feed
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {quickLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-sky-200 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-500"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              <Link
                href="/help"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-sky-200 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-500"
              >
                Report broken link
              </Link>
            </div>

            <p className="mt-6 text-sm text-slate-500">
              If you typed the address manually, check the spelling and try
              again.
            </p>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-[2rem] border border-sky-100 bg-white/75 p-6 shadow-[0_30px_80px_rgba(148,163,184,0.18)] backdrop-blur xl:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.16),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.86),rgba(239,246,255,0.96))]" />
              <div className="absolute inset-6 rounded-[1.5rem] border border-sky-100/80" />
              <div className="absolute left-8 top-14 h-px w-[40%] bg-gradient-to-r from-sky-300 to-transparent" />
              <div className="absolute left-[12%] top-[42%] h-px w-[44%] rotate-[8deg] bg-gradient-to-r from-sky-300 via-indigo-300 to-sky-400" />
              <div className="absolute left-[44%] top-[58%] h-px w-[18%] -rotate-[28deg] bg-gradient-to-r from-sky-300 to-indigo-300" />
              <div className="absolute left-[10%] top-[39%] h-3.5 w-3.5 rounded-full bg-white ring-8 ring-sky-100" />
              <div className="absolute left-[52%] top-[48%] h-3.5 w-3.5 rounded-full bg-slate-300 ring-8 ring-slate-100" />
              <div className="absolute left-[60%] top-[56%] h-3.5 w-3.5 rounded-full bg-amber-400 ring-8 ring-amber-100" />
              <div className="absolute right-[12%] top-[22%] flex h-40 w-40 items-center justify-center rounded-full border border-sky-200/80 bg-[radial-gradient(circle,rgba(191,219,254,0.65),rgba(255,255,255,0.32)_60%,rgba(255,255,255,0))] shadow-[0_0_60px_rgba(125,211,252,0.22)] sm:h-44 sm:w-44">
                <span className="text-6xl font-black tracking-[-0.08em] text-slate-800 sm:text-7xl">
                  404
                </span>
              </div>

              <div className="relative grid min-h-[360px] content-end">
                <div className="rounded-[1.5rem] border border-dashed border-sky-100 bg-white/35 p-4 text-right text-sm font-medium tracking-[0.12em] text-slate-400 uppercase sm:p-6">
                  Celestial route map · destination unavailable
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
