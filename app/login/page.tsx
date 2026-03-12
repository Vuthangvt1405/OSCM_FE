import SiteHeader from "@/components/Header";
import LoginForm from "@/components/LoginForm";
import React from "react";

const page = () => {
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
