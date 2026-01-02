"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/ui";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated (token in cookies)
    const checkAuth = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.user?.organizationId) {
            router.push(`/orgs/${data.user.organizationId}`);
          } else {
            router.push("/login");
          }
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  return <Loading message="Loading..." />;
}
