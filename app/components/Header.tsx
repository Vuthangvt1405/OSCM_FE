import Link from "next/link";
import type { ReactNode } from "react";
import { Bell, LogIn, PencilLine, Search, UserPlus } from "lucide-react";
import { SidebarMenuButtonWrapper } from "@/features/sidebar";
import { SearchBarCompact } from "@/features/search/components/SearchBar";
import { getCurrentUserOrNullServer } from "@/lib/server/social";

type HeaderActionProps = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

function HeaderAction({ href, label, Icon }: HeaderActionProps) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

export type SiteHeaderProps = {
  activeBar?: string;
  children?: ReactNode;
};

type HeaderUser = {
  displayName: string;
  initials: string;
  avatarUrl?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getInitials(name: string) {
  const normalized = name.trim();
  if (!normalized) return "U";
  return normalized
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

async function getHeaderUser(): Promise<HeaderUser | null> {
  // Use the server-side function which reads cookies directly
  // This works in Server Components unlike the client-side getCurrentUserOrNull
  // Returns null for 401 (not authenticated) or 403 (no social profile)
  const payload = await getCurrentUserOrNullServer();

  // If no user (auth failed or no profile), return null to show login
  if (!payload) {
    return null;
  }

  const displayName = payload.displayName || payload.username || "User";
  const avatarUrl = payload.profilePictureUrl || null;

  return {
    displayName,
    initials: getInitials(displayName),
    avatarUrl,
  };
}

const dropDownComponent = [
  {
    href: "/profile",
    label: "Profile",
    Icon: PencilLine,
  },
  {
    href: "/settings",
    label: "Settings",
    Icon: PencilLine,
  },
];

export async function SiteHeader({ children }: SiteHeaderProps) {
  const user = await getHeaderUser();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/88 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <SidebarMenuButtonWrapper />
        </div>

        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 pl-14 sm:px-6 sm:pl-16 lg:px-8 lg:pl-20">
          <Link
            href="/"
            className="text-slate-950 place-items-center text-lg font-bold"
            style={{ fontFamily: "var(--font-sigmar-one)" }}
            aria-label="Home"
          >
            ODYSSEUS
          </Link>

          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:hidden"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          <SearchBarCompact placeholder="Search" />

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <HeaderAction href="/write" label="Write" Icon={PencilLine} />

                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                </button>

                <div className="group relative">
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-900 text-sm font-semibold text-white shadow-sm transition group-hover:border-slate-300"
                    aria-label={`Account: ${user.displayName}`}
                    title={user.displayName}
                  >
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 object-cover"
                      />
                    ) : (
                      user.initials
                    )}
                  </button>

                  <div
                    className="invisible absolute right-0 top-full z-20 mt-2 w-48 translate-y-2 rounded-2xl border border-slate-200 bg-white p-1.5 opacity-0 shadow-[0_18px_48px_rgba(15,23,42,0.12)] transition duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
                    role="menu"
                    aria-label="Account menu"
                  >
                    {dropDownComponent.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                        role="menuitem"
                      >
                        {item.label}
                      </Link>
                    ))}

                    <div className="my-1.5 h-px bg-slate-100" />
                    <Link
                      href="/logout"
                      className="block rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      role="menuitem"
                    >
                      Logout
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <>
                <HeaderAction href="/login" label="Login" Icon={LogIn} />
                <HeaderAction
                  href="/register"
                  label="Register"
                  Icon={UserPlus}
                />
              </>
            )}
          </div>
        </div>
      </header>

      {children}
    </>
  );
}

export default SiteHeader;
