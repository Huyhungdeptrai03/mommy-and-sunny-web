import Link from "next/link";
import { Calendar, ArrowUpRight } from "lucide-react";
import { ArticleListItem } from "@/types/article";
import Reveal from "@/components/ui/Reveal";

export default function ArticleListView({
  items,
  basePath,
  emptyMessage,
}: {
  items: ArticleListItem[];
  basePath: string;
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--brand-text-muted)]">{emptyMessage}</p>;
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
      {items.map((article, i) => (
        <Reveal key={article.id} delay={Math.min(i * 60, 300)}>
          <Link href={`${basePath}/${article.slug}`} className="group block">
            <div className="relative aspect-[4/3] overflow-hidden bg-[var(--brand-cream-dark)]">
              {article.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={article.coverImageUrl}
                  alt={article.title}
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-[var(--brand-text-muted)]">
                  Chưa có ảnh
                </div>
              )}
            </div>
            <div className="pt-4">
              {article.publishedAt && (
                <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[var(--brand-text-muted)]">
                  <Calendar size={11} />
                  {new Date(article.publishedAt).toLocaleDateString("vi-VN")}
                </p>
              )}
              <h2 className="font-heading mt-2 text-base font-semibold text-[var(--brand-text)] line-clamp-2 transition-colors group-hover:text-[var(--brand-olive)]">
                {article.title}
              </h2>
              {article.excerpt && (
                <p className="mt-2 text-sm leading-relaxed text-[var(--brand-text-muted)] line-clamp-2">
                  {article.excerpt}
                </p>
              )}
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-widest text-[var(--brand-text)]">
                Đọc tiếp
                <ArrowUpRight
                  size={12}
                  className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </span>
            </div>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
