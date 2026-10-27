"use client";

import CoverflowDocuments, { type TravelDocument } from "./coverflow-documents";

const demoDocuments: TravelDocument[] = [
  {
    tag: "#Ásia",
    country: "CHINA",
    subtitle: "PASSAGEM AÉREA",
    subject: "Xangai e Pequim, 10 dias",
    img: "https://images.unsplash.com/photo-1548919973-5cef591cdbc9?auto=format&fit=crop&w=900&q=85",
    pdfUrl: "/documents/china-passagem.pdf",
  },
  {
    tag: "#América",
    country: "ESTADOS UNIDOS",
    subtitle: "ROTEIRO DE VIAGEM",
    subject: "Nova York, 7 dias",
    img: "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=900&q=85",
    pdfUrl: "/documents/estados-unidos-roteiro.pdf",
  },
  {
    tag: "#Europa",
    country: "PORTUGAL",
    subtitle: "PASSAGEM AÉREA",
    subject: "Lisboa e Porto, 9 dias",
    img: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=85",
    pdfUrl: "/documents/portugal-passagem.pdf",
  },
  {
    tag: "#Europa",
    country: "ESPANHA",
    subtitle: "VOUCHER DE HOSPEDAGEM",
    subject: "Madri e Barcelona, 8 dias",
    img: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=900&q=85",
    pdfUrl: "/documents/espanha-voucher.pdf",
  },
  {
    tag: "#Europa",
    country: "FRANÇA",
    subtitle: "CHECKLIST DE EMISSÃO",
    subject: "Paris, 6 dias",
    img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=85",
    pdfUrl: "/documents/franca-checklist.pdf",
  },
];

export default function CoverflowDocumentsDemo() {
  return <CoverflowDocuments items={demoDocuments} />;
}
