import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LearningSite from "@/components/learning-site";
import { siteRoutes } from "@/lib/site-routes";

type Props = { params: Promise<{ path?: string[] }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return siteRoutes.map(({ path }) => ({ path: path === "/" ? [] : path.slice(1).split("/") }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { path = [] } = await params;
  const route = siteRoutes.find((route) => route.path === `/${path.join("/")}`);
  return { title: route ? `${route.title} | Milhas Rotadas — Domine suas Milhas` : "Milhas Rotadas — Domine suas Milhas" };
}
export default async function Page({ params }: Props) {
  const { path = [] } = await params;
  const pageIndex = siteRoutes.findIndex((route) => route.path === `/${path.join("/")}`);
  if (pageIndex === -1) notFound();
  return <LearningSite pageIndex={pageIndex} />;
}
