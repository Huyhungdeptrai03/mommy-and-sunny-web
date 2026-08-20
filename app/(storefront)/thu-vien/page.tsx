import { getArticles } from "@/features/articles/api";
import ArticleListView from "@/features/articles/components/ArticleListView";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const result = await getArticles({ category: "Library", pageSize: 12 });

  return (
    <main className="px-6 md:px-12 py-12">
      <div className="mb-12 max-w-2xl">
        <span className="text-xs uppercase tracking-[0.3em] text-[var(--brand-accent)]">
          Crab Bébé
        </span>
        <h1 className="font-heading mt-2 text-4xl md:text-5xl font-extrabold leading-tight text-[var(--brand-text)]">
          Thư viện
        </h1>
        <p className="mt-3 text-sm text-[var(--brand-text-muted)]">
          Cẩm nang chọn đồ, hướng dẫn chăm sóc bé và mẹo hay từ Crab Bébé.
        </p>
      </div>
      <ArticleListView
        items={result.items}
        basePath="/thu-vien"
        emptyMessage="Chưa có bài viết nào, quay lại sau nhé."
      />
    </main>
  );
}
