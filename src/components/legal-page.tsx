import Link from "next/link";
import { notFound } from "next/navigation";
import type { LegalPage as LegalPageType } from "@/lib/legal-content";
import { getLegalPage } from "@/lib/legal-content";

export function LegalPage({ slug }: { slug: LegalPageType["slug"] }) {
  const page = getLegalPage(slug);
  if (!page) notFound();
  return <main className="legal-page"><header className="legal-header"><Link href="/" className="legal-brand">Milhas Rotadas</Link><nav aria-label="Documentos legais"><Link href="/privacidade">Privacidade</Link><Link href="/cookies">Cookies</Link><Link href="/termos">Termos</Link><Link href="/reembolso">Reembolso</Link><Link href="/direitos">Seus direitos</Link></nav></header><article className="legal-document"><p className="legal-eyebrow">INFORMAÇÕES LEGAIS</p><h1>{page.title}</h1><p className="legal-updated">Última atualização: {page.updatedAt}</p>{page.sections.map((section) => <section key={section.heading}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}</article><footer className="legal-footer"><span>© 2026 Milhas Rotadas</span><Link href="/">Voltar ao início</Link></footer></main>;
}
