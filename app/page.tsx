import { SiteHeader } from "./components/Header";
import { HomePageContent } from "./components/HomePageContent";

export default function Home() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <SiteHeader activeBar="Social">
        <HomePageContent />
      </SiteHeader>
    </div>
  );
}
