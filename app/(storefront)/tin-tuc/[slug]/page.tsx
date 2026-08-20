import axios from "axios";
import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/features/articles/api";
import ArticleDetailView from "@/features/articles/components/ArticleDetailView";

export const dynamic = "force-dynamic";

interface NewsDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug } = await params;

  let article;
  try {
    article = await getArticleBySlug(slug);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      notFound();
    }
    throw error;
  }

  return <ArticleDetailView article={article} basePath="/tin-tuc" sectionLabel="Tin tức" />;
}
