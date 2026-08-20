import Link from "next/link";
import { ChevronRight, Calendar, User } from "lucide-react";
import { Article } from "@/types/article";

export default function ArticleDetailView({
  article,
  basePath,
  sectionLabel,
}: {
  article: Article;
  basePath: string;
  sectionLabel: string;
}) {
  // Nội dung là plain text (không có trình soạn thảo rich-text) — tách đoạn theo dòng
  // trống, KHÔNG render HTML thô (tránh cần sanitize XSS cho nội dung admin nhập)
  const paragraphs = article.content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <main className="mx-auto max-w-3xl px-6 md:px-12 py-12">
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-[var(--brand-text-muted)]">
        <Link href="/" className="hover:text-[var(--brand-text)] transition-colors">
          Trang chủ
        </Link>
        <ChevronRight size={12} />
        <Link href={basePath} className="hover:text-[var(--brand-text)] transition-colors">
          {sectionLabel}
        </Link>
        <ChevronRight size={12} />
        <span className="line-clamp-1 font-medium text-[var(--brand-text)]">{article.title}</span>
      </nav>

      <h1 className="font-heading text-3xl md:text-4xl font-extrabold leading-tight text-[var(--brand-text)]">
        {article.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--brand-text-muted)]">
        {article.publishedAt && (
          <span className="flex items-center gap-1.5">
            <Calendar size={13} />
            {new Date(article.publishedAt).toLocaleDateString("vi-VN")}
          </span>
        )}
        {article.authorName && (
          <span className="flex items-center gap-1.5">
            <User size={13} />
            {article.authorName}
          </span>
        )}
      </div>

      {article.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.coverImageUrl}
          alt={article.title}
          className="mt-8 aspect-video w-full bg-[var(--brand-cream-dark)] object-cover"
        />
      )}

      <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-[var(--brand-text)]">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <Link
        href={basePath}
        className="mt-12 inline-flex items-center gap-2 border border-[var(--brand-border)] px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[var(--brand-text)] transition-colors hover:border-[var(--brand-text)]"
      >
        ← Quay lại {sectionLabel}
      </Link>
    </main>
  );
}
