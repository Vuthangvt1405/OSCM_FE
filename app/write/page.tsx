import SiteHeader from "@/components/Header";
import { WritePageContent } from "@/features/social/components/WritePageContent";

const WritePage = async () => {
  return (
    <SiteHeader>
      <WritePageContent />
    </SiteHeader>
  );
};

export default WritePage;
