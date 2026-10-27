"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Lang = "pt-BR" | "en" | "pt-PT" | "es" | "ja" | "zh";
type DocumentKey = "o-que-sao-milhas" | "programas-de-fidelidade";

const languages: { code: Lang; label: string }[] = [
  { code: "pt-BR", label: "Português (Brasil)" },
  { code: "en", label: "English" },
  { code: "pt-PT", label: "Português (Portugal)" },
  { code: "es", label: "Español" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
];

const money: Record<Lang, (value: number) => string> = {
  "pt-BR": (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value),
  en: (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value * 0.18),
  "pt-PT": (value) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value * 0.16),
  es: (value) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value * 0.16),
  ja: (value) => new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(value * 27),
  zh: (value) => new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" }).format(value * 1.3),
};

const copy: Record<Lang, Record<string, string>> = {
  "pt-BR": { material: "MATERIAL DA AULA 01", reader: "Leitura no seu idioma", original: "Abrir PDF original", back: "Voltar para a aula", welcome: "Prazer, Laryany!", intro: "Sou apaixonada por viagens e por transformar sonhos em embarques com milhas, planejamento e estratégia.", miles: "O que são milhas?", milesBody: "Milhas são a moeda dos programas de fidelidade das companhias aéreas, como GOL, Azul e LATAM.", points: "E os pontos?", pointsBody: "Pontos são recompensas de bancos ou de sites parceiros. Eles podem ser transferidos para programas de fidelidade.", thousand: "O que é milheiro?", thousandBody: "Um milheiro equivale a 1.000 milhas. Exemplo: 15 mil milhas equivalem a 15 milheiros.", prices: "Referências de valor do milheiro", programs: "Programas de fidelidade", programsBody: "São programas criados pelas companhias aéreas para recompensar clientes.", register: "Faça seu cadastro agora", registerBody: "O cadastro é gratuito. Conheça os programas e mantenha seus dados atualizados.", companies: "Programas apresentados", source: "O PDF original permanece disponível em português." },
  en: { material: "LESSON 01 MATERIAL", reader: "Read in your language", original: "Open original PDF", back: "Back to lesson", welcome: "Nice to meet you, I am Laryany!", intro: "I love travel and turning dreams into takeoffs through miles, planning and strategy.", miles: "What are miles?", milesBody: "Miles are the currency of airline loyalty programs, such as GOL, Azul and LATAM.", points: "What about points?", pointsBody: "Points are rewards from banks or partner websites. They can be transferred to loyalty programs.", thousand: "What is a thousand-mile unit?", thousandBody: "One unit equals 1,000 miles. Example: 15,000 miles equal 15 units.", prices: "Thousand-mile value references", programs: "Loyalty programs", programsBody: "These programs are created by airlines to reward customers.", register: "Register now", registerBody: "Registration is free. Get to know the programs and keep your information updated.", companies: "Programs covered", source: "The original PDF remains available in Portuguese." },
  "pt-PT": { material: "MATERIAL DA AULA 01", reader: "Leitura no seu idioma", original: "Abrir PDF original", back: "Voltar à aula", welcome: "Prazer, sou a Laryany!", intro: "Sou apaixonada por viagens e por transformar sonhos em embarques com milhas, planeamento e estratégia.", miles: "O que são milhas?", milesBody: "As milhas são a moeda dos programas de fidelização das companhias aéreas, como GOL, Azul e LATAM.", points: "E os pontos?", pointsBody: "Os pontos são recompensas de bancos ou de sites parceiros. Podem ser transferidos para programas de fidelização.", thousand: "O que é um milheiro?", thousandBody: "Um milheiro equivale a 1.000 milhas. Exemplo: 15 mil milhas equivalem a 15 milheiros.", prices: "Referências de valor do milheiro", programs: "Programas de fidelização", programsBody: "São programas criados pelas companhias aéreas para recompensar clientes.", register: "Faça o seu registo agora", registerBody: "O registo é gratuito. Conheça os programas e mantenha os seus dados atualizados.", companies: "Programas apresentados", source: "O PDF original continua disponível em português." },
  es: { material: "MATERIAL DE LA LECCIÓN 01", reader: "Lee en tu idioma", original: "Abrir PDF original", back: "Volver a la lección", welcome: "¡Mucho gusto, soy Laryany!", intro: "Me apasionan los viajes y transformar sueños en despegues con millas, planificación y estrategia.", miles: "¿Qué son las millas?", milesBody: "Las millas son la moneda de los programas de fidelidad de las aerolíneas, como GOL, Azul y LATAM.", points: "¿Y los puntos?", pointsBody: "Los puntos son recompensas de bancos o sitios asociados. Pueden transferirse a programas de fidelidad.", thousand: "¿Qué es un millar?", thousandBody: "Un millar equivale a 1.000 millas. Ejemplo: 15.000 millas equivalen a 15 millares.", prices: "Referencias de valor por millar", programs: "Programas de fidelidad", programsBody: "Son programas creados por las aerolíneas para recompensar a sus clientes.", register: "Regístrate ahora", registerBody: "El registro es gratuito. Conoce los programas y mantén tus datos actualizados.", companies: "Programas presentados", source: "El PDF original sigue disponible en portugués." },
  ja: { material: "レッスン01の教材", reader: "選択した言語で読む", original: "原文PDFを開く", back: "レッスンに戻る", welcome: "はじめまして、ラリアニーです！", intro: "旅行が大好きで、マイル・計画・戦略によって夢を出発へ変えるお手伝いをしています。", miles: "マイルとは？", milesBody: "マイルは、GOL、Azul、LATAMなど航空会社のロイヤルティプログラムで使われる通貨です。", points: "ポイントとは？", pointsBody: "ポイントは銀行や提携サイトからの特典です。ロイヤルティプログラムへ移行できます。", thousand: "ミルヘイロとは？", thousandBody: "1ミルヘイロは1,000マイルです。例：15,000マイルは15ミルヘイロです。", prices: "1ミルヘイロの参考価格", programs: "ロイヤルティプログラム", programsBody: "航空会社が顧客に特典を提供するために作ったプログラムです。", register: "今すぐ登録", registerBody: "登録は無料です。プログラムを知り、情報を最新に保ちましょう。", companies: "紹介されているプログラム", source: "原文PDFはポルトガル語で利用できます。" },
  zh: { material: "第01课学习材料", reader: "以所选语言阅读", original: "打开原始PDF", back: "返回课程", welcome: "很高兴认识你，我是Laryany！", intro: "我热爱旅行，并通过里程、规划和策略把梦想变成启程。", miles: "什么是里程？", milesBody: "里程是航空公司忠诚度计划中的货币，例如GOL、Azul和LATAM。", points: "什么是积分？", pointsBody: "积分是银行或合作网站提供的奖励，可以转入忠诚度计划。", thousand: "什么是千里程单位？", thousandBody: "一个千里程单位等于1,000里程。例如：15,000里程等于15个千里程单位。", prices: "每千里程价值参考", programs: "忠诚度计划", programsBody: "这些计划由航空公司创建，用于奖励客户。", register: "立即注册", registerBody: "注册免费。了解这些计划并保持资料更新。", companies: "材料中的计划", source: "原始PDF仍提供葡萄牙语版本。" },
};

export default function StudyDocumentReader({ documentKey }: { documentKey: DocumentKey }) {
  const [language, setLanguage] = useState<Lang>("pt-BR");
  useEffect(() => {
    const saved = window.localStorage.getItem("domine-language") as Lang | null;
    if (saved && languages.some((item) => item.code === saved)) setLanguage(saved);
  }, []);
  const t = copy[language];
  const isMiles = documentKey === "o-que-sao-milhas";
  const originalPdf = isMiles ? "/lesson-01/o-que-sao-milhas.pdf" : "/lesson-01/programas-de-fidelidade.pdf";
  const title = isMiles ? t.miles : t.programs;
  const priceRows = [["GOL", 13, 15], ["Azul", 14, 18], ["LATAM", 22, 25], ["Iberia, British e Qatar", 0, 55], ["TAP", 0, 35]];

  return <main className="study-reader"><header className="study-reader-header"><Link href="/aula" className="study-reader-back">← {t.back}</Link><label>{t.reader}<select value={language} onChange={(event) => { const next = event.target.value as Lang; setLanguage(next); window.localStorage.setItem("domine-language", next); }} aria-label={t.reader}>{languages.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label></header><article className="study-reader-paper"><span>{t.material}</span><h1>{title}</h1>{isMiles ? <><h2>{t.welcome}</h2><p>{t.intro}</p><section><h2>{t.miles}</h2><p>{t.milesBody}</p></section><section><h2>{t.points}</h2><p>{t.pointsBody}</p></section><section><h2>{t.thousand}</h2><p>{t.thousandBody}</p></section><section><h2>{t.prices}</h2><div className="study-price-grid">{priceRows.map(([name, min, max]) => <div key={String(name)}><b>{name}</b><span>{min ? `${money[language](Number(min))} – ` : ""}{money[language](Number(max))}</span></div>)}</div></section></> : <><p>{t.programsBody}</p><section><h2>{t.companies}</h2><div className="study-programs"><b>Smiles — GOL</b><b>TudoAzul — Azul</b><b>LATAM Pass — LATAM</b><b>Iberia Plus — Iberia</b><b>Qatar Airways — Qatar</b></div></section><section><h2>{t.register}</h2><p>{t.registerBody}</p></section></>}<footer><p>{t.source}</p><a href={originalPdf} target="_blank" rel="noreferrer">{t.original} ↗</a></footer></article></main>;
}
