import { SiteHeader } from "@/components/Header";
import { ProfileContent } from "./components/ProfileContent";

export default function ProfilePage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <SiteHeader activeBar="Profile">
        <ProfileContent />
      </SiteHeader>
    </div>
  );
}
