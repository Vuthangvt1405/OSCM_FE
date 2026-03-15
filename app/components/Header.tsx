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
      className="inline-flex h-9 items-center gap-2 rounded-full border border-(--header-control-border) bg-(--header-control-bg) px-3 text-sm font-medium text-foreground transition hover:bg-(--header-control-hover)"
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

  console.log("user:", user);
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-(--header-border) bg-(--header-bg) shadow-(--header-shadow) backdrop-blur relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <SidebarMenuButtonWrapper />
        </div>

        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 pl-14">
          <Link
            href="/"
            className="text-black place-items-center text-lg font-bold "
            style={{ fontFamily: "var(--font-sigmar-one)" }}
            aria-label="Home"
          >
            ODYSSEUS
          </Link>

          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-(--header-control-border) bg-(--header-control-bg) text-foreground transition hover:bg-(--header-control-hover) sm:hidden"
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
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--header-control-border) bg-(--header-control-bg) text-foreground transition hover:bg-(--header-control-hover)"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                </button>

                <details className="relative">
                  <summary
                    className="inline-flex h-9 w-9 cursor-pointer list-none items-center justify-center overflow-hidden rounded-full bg-slate-900 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden"
                    aria-label={`Account: ${user.displayName}`}
                    title={user.displayName}
                  >
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl}
                        alt=""
                        width={36}
                        height={36}
                        className="h-9 w-9 object-cover"
                      />
                    ) : (
                      user.initials
                    )}
                  </summary>

                  <div
                    className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
                    role="menu"
                    aria-label="Account menu"
                  >
                    {dropDownComponent.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
                        role="menuitem"
                      >
                        {item.label}
                      </Link>
                    ))}

                    <div className="my-1 h-px bg-slate-200" />
                    <Link
                      href="/logout"
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      role="menuitem"
                    >
                      Logout
                    </Link>
                  </div>
                </details>
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
