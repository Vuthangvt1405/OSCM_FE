import Image from "next/image";
import Link from "next/link";
import type { Announcement, Topic } from "@/lib/social/types";
import { Sparkles } from "lucide-react";

type StaffPick = {
  id: string;
  authorName: string;
  publicationLabel?: string;
  title: string;
  dateLabel: string;
  image?: { src: string; alt: string };
  href?: string;
};

export type RightSideBarProps = {
  topics: Topic[];
  announcements: Announcement[];
  staffPicks?: StaffPick[];
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function isValidImageSrc(src: string | undefined): boolean {
  if (!src || typeof src !== "string") return false;
  const s = src.trim();
  if (!s) return false;
  if (s.startsWith("/")) return true;
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

function Avatar({
  name,
  src,
  size,
}: {
  name: string;
  src?: string;
  size: number;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={`${name} avatar`}
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    );
  }

  return (
    <div
      className="grid place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700"
      style={{ width: size, height: size }}
      aria-label={`${name} avatar`}
    >
      {getInitials(name)}
    </div>
  );
}

function StaffPickItem({ pick }: { pick: StaffPick }) {
  const href = pick.href ?? "#";
  return (
    <div className="flex gap-3">
      <div className="mt-1 shrink-0">
        {pick.image && isValidImageSrc(pick.image.src) ? (
          <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
            <Image
              src={pick.image.src}
              alt={pick.image.alt}
              width={36}
              height={36}
              className="h-9 w-9 object-cover"
            />
          </div>
        ) : (
          <Avatar name={pick.authorName} size={36} />
        )}
      </div>

      <div className="min-w-0">
        <div className="truncate text-sm text-slate-600">
          <span className="font-medium text-slate-900">{pick.authorName}</span>
          {pick.publicationLabel ? (
            <>
              <span className="text-slate-400"> in </span>
              <span className="text-slate-700">{pick.publicationLabel}</span>
            </>
          ) : null}
        </div>

        <Link
          href={href}
          className="mt-1 block text-base font-extrabold leading-snug text-slate-900 transition hover:underline"
        >
          {pick.title}
        </Link>

        <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>{pick.dateLabel}</span>
        </div>
      </div>
    </div>
  );
}

export function RightSideBar({
  topics,
  announcements,
  staffPicks,
}: RightSideBarProps) {
  const picks: StaffPick[] = staffPicks ?? [
    {
      id: "sp1",
      authorName: "Hartarto",
      title: "15 Free OSINT Tools That Reveal Everything Online (2026 Guide)",
      dateLabel: "Jan 7",
      image: { src: "/globe.svg", alt: "Staff pick image" },
    },
    {
      id: "sp2",
      authorName: "Tanmov Goswami",
      title: "A letter to myself on my 43rd birthday",
      dateLabel: "Feb 3",
    },
    {
      id: "sp3",
      authorName: "Diana Craciun",
      publicationLabel: "Philosophy Today",
      title: "Can Imagining Help Us Make Good Decisions?",
      dateLabel: "Jan 20",
    },
  ];

  return (
    <div className="space-y-10">
      <section>
        <div className="text-xl font-extrabold text-slate-900">Staff Picks</div>

        <div className="mt-5 space-y-6">
          {picks.map((pick) => (
            <StaffPickItem key={pick.id} pick={pick} />
          ))}
        </div>

        <Link
          href="#"
          className="mt-6 inline-flex text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          See the full list
        </Link>
      </section>

      <section>
        <div className="text-xl font-extrabold text-slate-900">
          Recommended topics
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href="#"
              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              title={topic.membersLabel}
            >
              {topic.name}
            </Link>
          ))}
        </div>
      </section>

      {announcements.length > 0 && (
        <section>
          <div className="text-xl font-extrabold text-slate-900">
            Announcements
          </div>

          <div className="mt-5 space-y-4">
            {announcements.map((announcement, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="text-sm font-medium text-slate-900">
                  {announcement.authorName}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {announcement.body}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
