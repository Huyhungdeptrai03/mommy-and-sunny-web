"use client";

import { useEffect, useState } from "react";

function getTimeParts(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return null;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { hours, minutes, seconds };
}

export default function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [parts, setParts] = useState(() => getTimeParts(endsAt));

  useEffect(() => {
    const timer = setInterval(() => {
      setParts(getTimeParts(endsAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  if (!parts) {
    return <span className="text-red-600 font-semibold">Đã kết thúc</span>;
  }

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <span className="font-mono font-semibold">
      {pad(parts.hours)}:{pad(parts.minutes)}:{pad(parts.seconds)}
    </span>
  );
}