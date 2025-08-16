"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      // যদি login না করা থাকে
      router.push("/auth/login");
    } else {
      // login আছে, main page চালাও
      router.push("/dashboard"); // main dashboard route
    }
  }, [router]);

  return <div>Loading...</div>; // temporary loading
}
