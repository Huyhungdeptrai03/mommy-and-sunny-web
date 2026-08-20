import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

export default function Pagination({ page, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const linkClass =
    "flex items-center gap-1 text-xs font-medium uppercase tracking-widest text-[var(--brand-text)] hover:text-[var(--brand-accent)] transition-colors";
  const disabledClass =
    "flex items-center gap-1 text-xs font-medium uppercase tracking-widest text-[var(--brand-text-muted)] opacity-40 cursor-not-allowed";

  return (
    <nav className="mt-12 flex items-center justify-center gap-6" aria-label="Phân trang">
      {hasPrev ? (
        <Link href={buildHref(page - 1)} className={linkClass}>
          <ChevronLeft size={14} />
          Trước
        </Link>
      ) : (
        <span className={disabledClass}>
          <ChevronLeft size={14} />
          Trước
        </span>
      )}

      <span className="text-xs text-[var(--brand-text-muted)]">
        Trang {page}/{totalPages}
      </span>

      {hasNext ? (
        <Link href={buildHref(page + 1)} className={linkClass}>
          Sau
          <ChevronRight size={14} />
        </Link>
      ) : (
        <span className={disabledClass}>
          Sau
          <ChevronRight size={14} />
        </span>
      )}
    </nav>
  );
}
