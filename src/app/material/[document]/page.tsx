import { notFound } from "next/navigation";
import StudyDocumentReader from "@/components/study-document-reader";

const documents = ["o-que-sao-milhas", "programas-de-fidelidade"] as const;

export function generateStaticParams() {
  return documents.map((document) => ({ document }));
}

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ document: string }>;
}) {
  const { document } = await params;
  if (!documents.includes(document as (typeof documents)[number])) notFound();
  return <StudyDocumentReader documentKey={document as (typeof documents)[number]} />;
}
