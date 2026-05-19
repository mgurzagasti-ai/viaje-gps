"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type MonitorAutoRefreshProps = {
  intervalMs?: number;
};

export function MonitorAutoRefresh({
  intervalMs = 15000,
}: MonitorAutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [intervalMs, router]);

  return null;
}
