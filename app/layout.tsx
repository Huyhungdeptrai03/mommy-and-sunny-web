import type { Metadata } from "next";
import { Geist_Mono, Montserrat, Inter } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Montserrat cho heading — uppercase, letter-spacing rộng, đúng tinh thần
// biên tập/boutique cao cấp thay vì phong cách "mềm" trước đây.
const montserrat = Montserrat({
  variable: "--font-heading-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
});

// Inter cho phần thân — trung tính, dễ đọc, có subset "vietnamese" đầy đủ dấu
// (Poppins bản next/font/google KHÔNG có subset vietnamese, dễ vỡ dấu tiếng Việt).
const inter = Inter({
  variable: "--font-body-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Crab Bébé",
  description: "Imported Beauty & Lifestyle — mỹ phẩm và đồ sống nhập khẩu chính hãng từ Đức, Nhật, Hàn.",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistMono.variable} ${montserrat.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--brand-cream)] text-[var(--brand-text)]">
        {children}
      </body>
    </html>
  );
}
