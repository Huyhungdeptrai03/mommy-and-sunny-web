import Header from "@/components/layout/Header";
import TopBar from "@/components/layout/TopBar";
import Footer from "@/components/layout/Footer";
import LiveChatWidget from "@/components/layout/LiveChatWidget";
import StickyContactButtons from "@/components/ui/StickyContactButtons";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <Header />
      {children}
      <Footer />
      <StickyContactButtons />
      <LiveChatWidget />
    </>
  );
}
