import SiteHeader from "@/components/Header";
import { WritePageContent } from "@/features/social/components/WritePageContent";
import { isAuthenticated } from "@/lib/auth/auth-check";
import { redirect } from "next/navigation";

const WritePage = async () => {
  if (!(await isAuthenticated())) {
    redirect("/login?callbackUrl=/write");
  }

  return (
    <SiteHeader>
      <WritePageContent />
    </SiteHeader>
  );
};

export default WritePage;
