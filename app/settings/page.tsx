import { SiteHeader } from "@/components/Header";
import { SettingsContent } from "./components/SettingsContent";

export default function SettingsPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <SiteHeader activeBar="Settings">
        <SettingsContent />
      </SiteHeader>
    </div>
  );
}

