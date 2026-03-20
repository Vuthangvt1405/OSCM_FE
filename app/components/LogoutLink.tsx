"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type LogoutLinkProps = {
  className?: string;
  role?: string;
};

export default function LogoutLink({ className, role }: LogoutLinkProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }, [isSubmitting, router]);

  return (
    <button
      type="button"
      className={className}
      role={role}
      onClick={handleLogout}
      disabled={isSubmitting}
    >
      Logout
    </button>
  );
}
