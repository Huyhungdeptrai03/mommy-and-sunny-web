import axios from "axios";
import { notFound } from "next/navigation";
import { getPolicyBySlug } from "@/features/policies/api";

export const dynamic = "force-dynamic";

interface PolicyPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { slug } = await params;

  let policy;
  try {
    policy = await getPolicyBySlug(slug);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <main className="max-w-3xl mx-auto px-6 md:px-0 py-16">
      <h1 className="font-heading text-3xl font-extrabold text-[var(--brand-text)] mb-8">
        {policy.title}
      </h1>
      <div className="prose prose-sm max-w-none whitespace-pre-line text-[var(--brand-text)] leading-relaxed">
        {policy.content}
      </div>
    </main>
  );
}
