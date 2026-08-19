import Header from "@/components/layout/Header";
import TopBar from "@/components/layout/TopBar";
import CategoryNavBar from "@/components/layout/CategoryNavBar";
import Footer from "@/components/layout/Footer";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <Header />
      <CategoryNavBar />
      {children}
      <Footer />
    </>
  );
}