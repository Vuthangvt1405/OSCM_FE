import { SiteHeader } from "@/components/Header";
import { OtherProfileContent } from "./components/OtherProfileContent";

interface OtherProfilePageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function OtherProfilePage({
  params,
}: OtherProfilePageProps) {
  const { userId } = await params;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <SiteHeader activeBar="Profile">
        <OtherProfileContent userId={userId} />
      </SiteHeader>
    </div>
  );
}
