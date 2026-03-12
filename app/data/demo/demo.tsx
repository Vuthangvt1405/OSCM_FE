import type { FeedPost, Topic, Announcement } from "@/lib/social/types";

export const DEMO_FEED: FeedPost[] = [
  {
    id: "p1",
    authorName: "Alex CUCU",
    authorRole: "admin",
    title: "Bài Báo Về Skibidi mới nhất ở đồng nai",
    caption: "Đây là caption nè ahihi",
    score: 10,
    createdAtLabel: "12h · 23/12/2026",
    likeCount: 5,
    dislikeCount: 0,
  },
  {
    id: "p2",
    authorName: "Alex CUCU",
    title: "Bài Báo Về Skibidi mới nhất ở đồng nai",
    caption: "Đây là caption nè ahihi",
    score: 10,
    createdAtLabel: "12h · 23/12/2026",
    image: { src: "/globe.svg", alt: "Post image" },
    likeCount: 3,
    dislikeCount: 1,
  },
];

export const DEMO_TOPICS: Topic[] = [
  { id: "t1", name: "Java Spring", membersLabel: "1024 members" },
  {
    id: "t2",
    name: "Java Spring skibidi toilet dop dop...",
    membersLabel: "1024 members",
  },
  { id: "t3", name: "Java Spring", membersLabel: "1024 members" },
];

export const DEMO_ANNOUNCEMENT: Announcement = {
  authorName: "Admin brihhhh",
  body: "jalshdjàhdjkàhjkbhksndc ksjdcbbjkbjkhdkjàkhdjkàhdj aksdqkshdqks",
};

export const DEMO_ANNOUNCEMENTS: Announcement[] = [DEMO_ANNOUNCEMENT];
