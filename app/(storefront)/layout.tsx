import Header from "@/components/layout/Header";
import TopBar from "@/components/layout/TopBar";
import Footer from "@/components/layout/Footer";
import StorefrontSupportWidgets from "@/components/auth/StorefrontSupportWidgets";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <Header />
      {children}
      <Footer />
      <StorefrontSupportWidgets />
    </>
  );
}
