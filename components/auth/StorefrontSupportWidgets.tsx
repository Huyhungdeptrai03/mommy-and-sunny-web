"use client";

import { usePathname } from "next/navigation";
import LiveChatWidget from "@/components/layout/LiveChatWidget";
import StickyContactButtons from "@/components/ui/StickyContactButtons";

export default function StorefrontSupportWidgets() {
  const pathname = usePathname();
  // Floating controls covered password fields and verification copy on small screens.
  if (["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"].includes(pathname)) return null;
  return <><StickyContactButtons /><LiveChatWidget /></>;
}
