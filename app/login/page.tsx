import SiteHeader from "@/components/Header";
import LoginForm from "@/components/LoginForm";
import React from "react";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth/auth-check";

const page = async () => {
  // Redirect authenticated users to home page
  if (await isAuthenticated()) {
    redirect("/");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader activeBar="Social">
        <main className="mx-auto w-full max-w-6xl px-4 py-8">
          <div className="mx-auto max-w-md">
            <LoginForm></LoginForm>
          </div>
        </main>
      </SiteHeader>
    </div>
  );
};

export default page;
