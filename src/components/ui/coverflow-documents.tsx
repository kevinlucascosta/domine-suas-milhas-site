"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type TouchEvent } from "react";

export type TravelDocument = {
  tag: string;
  country: string;
  subtitle?: string;
  subject: string;
  img: string;
  pdfUrl: string;
  fileName?: string;
  confirmText?: string;
};

type CoverflowDocumentsProps = {
  items: TravelDocument[];
  title?: string;
  description?: string;
  onConfirm?: (item: TravelDocument) => void;
  translate?: (value: string) => string;
};

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {direction === "left" ? <><path d="m14.5 5-7 7 7 7" /><path d="M8 12h12" /></> : <><path d="m9.5 5 7 7-7 7" /><path d="M4 12h12" /></>}
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}

export default function CoverflowDocuments({ items, title = "Documentos de viagem", description = "Exemplos reais de emissões, roteiros e vouchers para explorar durante a aula.", onConfirm, translate = (value) => value }: CoverflowDocumentsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  const count = items.length;

  const move = (direction: -1 | 1) => {
    if (!count) return;
    setActiveIndex((current) => (current + direction + count) % count);
  };

  const confirm = (item: TravelDocument) => {
    if (onConfirm) {
      onConfirm(item);
      return;
    }
    window.open(item.pdfUrl, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (isPaused || userPaused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % count), 6000);
    return () => window.clearInterval(timer);
  }, [count, isPaused, userPaused]);

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStart.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStart.current === null) return;
    const end = event.changedTouches[0]?.clientX ?? touchStart.current;
    const distance = end - touchStart.current;
    if (Math.abs(distance) > 35) move(distance > 0 ? -1 : 1);
    touchStart.current = null;
  };

  const onCardKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveIndex(index);
    }
  };

  return (
    <section className="coverflow-documents" aria-label={translate(title)} onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} onFocus={() => setIsPaused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false); }} onKeyDown={(event) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); } }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="coverflow-heading">
        <div>
          <span className="coverflow-kicker">{translate("MATERIAIS DE EXEMPLO")}</span>
          <h3>{translate(title)}</h3>
          <p>{translate(description)}</p>
        </div>
        <span className="coverflow-counter">{String(activeIndex + 1).padStart(2, "0")} <i>/ {String(count).padStart(2, "0")}</i></span>
      </div>

      <div className="coverflow-stage" role="region" aria-roledescription="carrossel" aria-label={title}>
        <button className="coverflow-arrow coverflow-arrow-left" onClick={() => move(-1)} aria-label={translate("Documento anterior")}><ArrowIcon direction="left" /></button>
        <div className="coverflow-track">
          {items.map((item, index) => {
            const offset = index - activeIndex;
            const wrappedOffset = Math.abs(offset) > count / 2 ? offset - Math.sign(offset) * count : offset;
            const isActive = index === activeIndex;
            const position = Math.max(-2, Math.min(2, wrappedOffset));
            return (
              <button
                key={`${item.country}-${item.subject}`}
                className={`coverflow-card ${isActive ? "is-active" : ""} position-${position}`}
                onClick={() => setActiveIndex(index)}
                onKeyDown={(event) => onCardKeyDown(event, index)}
                aria-label={`${translate(item.country)} — ${translate(item.subject)}`}
                aria-current={isActive}
              >
                <span className="coverflow-image-wrap"><img src={item.img} alt={`${translate(item.country)} — ${translate(item.subject)}`} /></span>
                <span className="coverflow-card-body">
                  <span className="coverflow-tag">{translate(item.tag)}</span>
                  <strong>{translate(item.country)}</strong>
                  <small className="coverflow-subtitle">{translate(item.subtitle ?? "DOCUMENTO DE VIAGEM")}</small>
                  <span className="coverflow-subject">{translate(item.subject)}</span>
                  <span className="coverflow-file"><FileIcon /> {translate(item.fileName ?? "ARQUIVO: A DEFINIR")}</span>
                  <span className="coverflow-confirm" onClick={(event) => { event.stopPropagation(); confirm(item); }}>{translate(item.confirmText ?? "Confirmar")}<ArrowIcon direction="right" /></span>
                </span>
              </button>
            );
          })}
        </div>
        <button className="coverflow-arrow coverflow-arrow-right" onClick={() => move(1)} aria-label={translate("Próximo documento")}><ArrowIcon direction="right" /></button>
      </div>

      <div className="coverflow-footer">
        <div className="coverflow-dots" aria-label={translate("Paginação do carrossel")}>
          {items.map((item, index) => <button key={item.country} className={index === activeIndex ? "is-active" : ""} onClick={() => setActiveIndex(index)} aria-label={`${translate("Ir para")} ${translate(item.country)}`} aria-current={index === activeIndex} />)}
        </div>
        <span><FileIcon /> {translate("PDFs disponíveis:")} <b>{items.length}</b></span>
      </div>
    </section>
  );
}
