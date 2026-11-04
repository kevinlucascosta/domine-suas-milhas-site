"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

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

export function CookiePreferences() {
  const choice = useSyncExternalStore(subscribeChoice, readChoice, serverChoice);
  const [open, setOpen] = useState(false);
  useEffect(() => { const reopen = () => setOpen(true); window.addEventListener("milhas:cookie-preferences", reopen); return () => window.removeEventListener("milhas:cookie-preferences", reopen); }, []);
  const save = (preferences: boolean) => { const next = { necessary: true as const, preferences, updatedAt: new Date().toISOString() }; window.localStorage.setItem(storageKey, JSON.stringify(next)); window.dispatchEvent(new Event(preferenceChangeEvent)); setOpen(false); };
  if (choice === undefined || (!open && choice)) return null;
  return <section className="cookie-panel" role="dialog" aria-modal="true" aria-labelledby="cookie-preferences-title"><div><p className="small-label">SUA PRIVACIDADE</p><h2 id="cookie-preferences-title">Preferências de cookies</h2><p>Usamos cookies necessários para o funcionamento e, se você permitir, para lembrar preferências como idioma. Não ativamos publicidade ou analytics antes de uma escolha.</p><label className="cookie-option"><input type="checkbox" checked disabled /> Necessários para segurança e funcionamento</label><label className="cookie-option"><input type="checkbox" defaultChecked={choice?.preferences ?? false} id="cookie-preferences-toggle" /> Lembrar preferências no dispositivo</label><div className="cookie-actions"><button type="button" className="button" onClick={() => save(false)}>Apenas necessários</button><button type="button" className="button button-primary" onClick={() => save((document.getElementById("cookie-preferences-toggle") as HTMLInputElement | null)?.checked ?? false)}>Salvar escolhas</button></div></div></section>;
}

export function CookiePreferencesLink() {
  return <button type="button" className="cookie-preferences-link" onClick={() => window.dispatchEvent(new Event("milhas:cookie-preferences"))}>Preferências de cookies</button>;
}
