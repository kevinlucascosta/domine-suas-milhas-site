"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const storageKey = "milhas-cookie-preferences-v1";
const preferenceChangeEvent = "milhas:cookie-preferences-change";
type Choice = { necessary: true; preferences: boolean; updatedAt: string };
let cachedStoredChoice: string | null | undefined;
let cachedChoice: Choice | null = null;

function readChoice() {
  if (typeof window === "undefined") return null;
  const storedChoice = window.localStorage.getItem(storageKey);
  if (storedChoice === cachedStoredChoice) return cachedChoice;
  cachedStoredChoice = storedChoice;
  try {
    cachedChoice = JSON.parse(storedChoice ?? "null") as Choice | null;
  } catch {
    cachedChoice = null;
  }
  return cachedChoice;
}

function subscribeChoice(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(preferenceChangeEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(preferenceChangeEvent, callback);
  };
}

function serverChoice() {
  return undefined;
}

export function canPersistPreferences() {
  return readChoice()?.preferences === true;
}

export function CookiePreferences() {
  const choice = useSyncExternalStore(subscribeChoice, readChoice, serverChoice);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const visible = choice !== undefined && (open || !choice);
  useEffect(() => {
    const panel = panelRef.current;
    if (!visible || !panel) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const controls = () => Array.from(panel.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
    )).filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0);
    const focusFirst = () => (controls()[0] ?? panel).focus({ preventScroll: true });
    const keepFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !panel.contains(event.target)) focusFirst();
    };
    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const elements = controls();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first || !last) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
      } else if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel)) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    focusFirst();
    document.addEventListener("focusin", keepFocus);
    document.addEventListener("keydown", handleTab, true);
    return () => {
      document.removeEventListener("focusin", keepFocus);
      document.removeEventListener("keydown", handleTab, true);
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [visible]);
  useEffect(() => { const reopen = () => setOpen(true); window.addEventListener("milhas:cookie-preferences", reopen); return () => window.removeEventListener("milhas:cookie-preferences", reopen); }, []);
  const save = (preferences: boolean) => { const next = { necessary: true as const, preferences, updatedAt: new Date().toISOString() }; window.localStorage.setItem(storageKey, JSON.stringify(next)); if (!preferences) { window.localStorage.removeItem("domine-language"); window.dispatchEvent(new Event("domine-language-change")); } window.dispatchEvent(new Event(preferenceChangeEvent)); setOpen(false); };
  if (choice === undefined || (!open && choice)) return null;
  return <section ref={panelRef} tabIndex={-1} className="cookie-panel" role="dialog" aria-modal="true" aria-labelledby="cookie-preferences-title"><div><p className="small-label">SUA PRIVACIDADE</p><h2 id="cookie-preferences-title">Preferências de cookies</h2><p>Usamos cookies necessários para o funcionamento e, se você permitir, para lembrar preferências como idioma. Não ativamos publicidade ou analytics antes de uma escolha.</p><label className="cookie-option"><input type="checkbox" checked disabled /> Necessários para segurança e funcionamento</label><label className="cookie-option"><input type="checkbox" defaultChecked={choice?.preferences ?? false} id="cookie-preferences-toggle" /> Lembrar preferências no dispositivo</label><div className="cookie-actions"><button type="button" className="button" onClick={() => save(false)}>Apenas necessários</button><button type="button" className="button button-primary" onClick={() => save((document.getElementById("cookie-preferences-toggle") as HTMLInputElement | null)?.checked ?? false)}>Salvar escolhas</button></div></div></section>;
}

export function CookiePreferencesLink() {
  return <button type="button" className="cookie-preferences-link" onClick={() => window.dispatchEvent(new Event("milhas:cookie-preferences"))}>Preferências de cookies</button>;
}
