"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { getAdminUsers, updateUserRole } from "@/features/admin/users/api";
import { AdminUser } from "@/types/adminUser";

export default function AdminUserList() {
  const currentUser = useAuthStore((state) => state.user);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const inputClass =
    "border border-[var(--brand-border)] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--brand-olive)]";

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAdminUsers(search || undefined);
      setUsers(result.items);
    } catch {
      setError("Không thể tải danh sách người dùng");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleRole(u: AdminUser) {
    const newRole = u.role === "Admin" ? "Customer" : "Admin";
    const newRoleLabel = newRole === "Admin" ? "Quản trị viên" : "Khách hàng";
    if (!confirm(`Đổi quyền của "${u.fullName}" thành ${newRoleLabel}?`)) return;

    setActioningId(u.id);
    setError(null);
    try {
      await updateUserRole(u.id, newRole);
      await load();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Không thể cập nhật quyền");
      }
    } finally {
      setActioningId(null);
    }
  }

  if (isLoading) {
    return <main className="p-8 text-[var(--brand-text-muted)]">Đang tải...</main>;
  }

  return (
    <main className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="font-heading text-3xl font-extrabold text-[var(--brand-text)]">
          Quản lý người dùng
        </h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void load();
          }}
          className="flex gap-2"
        >
          <input
            placeholder="Tìm theo email/tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            className="bg-[var(--brand-olive)] text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Tìm
          </button>
        </form>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3">
          {error}
        </p>
      )}

      <div className=" border border-[var(--brand-border)] bg-white overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--brand-cream-dark)] text-left">
            <tr>
              <th className="p-3 font-heading text-[var(--brand-text)] whitespace-nowrap">Họ tên</th>
              <th className="p-3 font-heading text-[var(--brand-text)] whitespace-nowrap">Email</th>
              <th className="p-3 font-heading text-[var(--brand-text)] whitespace-nowrap">Vai trò</th>
              <th className="p-3 font-heading text-[var(--brand-text)] whitespace-nowrap">Xác thực email</th>
              <th className="p-3 font-heading text-[var(--brand-text)] whitespace-nowrap">Số đơn</th>
              <th className="p-3 font-heading text-[var(--brand-text)] whitespace-nowrap">Ngày tham gia</th>
              <th className="p-3 font-heading text-[var(--brand-text)] whitespace-nowrap">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-[var(--brand-text-muted)]">
                  Không tìm thấy người dùng nào
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="border-t border-[var(--brand-border)]">
                    <td className="p-3 font-medium text-[var(--brand-text)] whitespace-nowrap">
                      {u.fullName}{" "}
                      {isSelf && (
                        <span className="text-xs text-[var(--brand-text-muted)]">(bạn)</span>
                      )}
                    </td>
                    <td className="p-3 text-[var(--brand-text-muted)] whitespace-nowrap">
                      {u.email}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`text-xs font-semibold px-3 py-1 ${
                          u.role === "Admin"
                            ? "bg-[var(--brand-olive)] text-white"
                            : "bg-[var(--brand-cream-dark)] text-[var(--brand-text)]"
                        }`}
                      >
                        {u.role === "Admin" ? "Quản trị viên" : "Khách hàng"}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {u.emailVerified ? (
                        <span className="text-[var(--brand-olive)] text-xs font-medium">
                          Đã xác thực
                        </span>
                      ) : (
                        <span className="text-[var(--brand-text-muted)] text-xs">
                          Chưa xác thực
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-[var(--brand-text)]">{u.orderCount}</td>
                    <td className="p-3 text-[var(--brand-text-muted)] whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleRole(u)}
                        disabled={isSelf || actioningId === u.id}
                        className="text-[var(--brand-olive)] text-xs font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {u.role === "Admin" ? "Hạ xuống Khách hàng" : "Nâng lên Quản trị"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}