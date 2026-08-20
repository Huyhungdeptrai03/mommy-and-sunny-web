import { Metadata } from "next";
import PersonalImportRequestForm from "@/features/personal-import/components/PersonalImportRequestForm";

export const metadata: Metadata = {
  title: "Đặt hàng xách tay | Crab Be Bé",
  description: "Gửi yêu cầu đặt mua hộ sản phẩm xách tay từ nước ngoài — Crab Be Bé.",
};

export default function PersonalImportPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="font-heading text-3xl font-extrabold text-[var(--brand-text)] mb-2">
        Đặt hàng xách tay
      </h1>
      <p className="text-sm text-[var(--brand-text-muted)] mb-8">
        Bạn muốn mua một sản phẩm chưa có trong cửa hàng? Điền thông tin bên dưới, chúng tôi sẽ
        báo giá và hỗ trợ đặt mua hộ.
      </p>
      <PersonalImportRequestForm />
    </main>
  );
}
