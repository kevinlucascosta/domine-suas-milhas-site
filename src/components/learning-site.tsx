"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
  type TouchEvent,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { siteRoutes } from "@/lib/site-routes";
import {
  getHomeHeroRevealObserverOptions,
  HOME_HERO_MOTION,
} from "@/lib/home-hero-motion";
import { copyAdditions } from "@/lib/copy-additions";
import { lesson01TranslationRows } from "@/lib/lesson-01-translations";
import { courseMissionCopy } from "@/lib/course-missions-translations";
import { siteAuditTranslationRows } from "@/lib/site-audit-translations";
import {
  lesson01QuestionTranslations,
  lessonQuestionUi,
} from "@/lib/lesson-01-question-translations";
import CoverflowDocuments from "@/components/ui/coverflow-documents";
import { CookiePreferences, CookiePreferencesLink } from "@/components/cookie-preferences";
import {
  lesson01ChallengeQuestions,
  lesson01Documents,
  lesson01ReviewQuestions,
  type LessonQuestion,
} from "@/lib/lesson-01-content";
import { getLevelProgress } from "@/lib/level-system";
import { canContinueWithGuardianAuthorization } from "@/lib/guardian-authorization";
import {
  isLessonQuestionLocked,
  mergeLessonQuestionXpEntries,
} from "@/lib/lesson-question-progress";
import {
  createClient as createSupabaseClient,
  hasSupabaseBrowserConfig,
} from "@/lib/supabase/client";
import homeMotionStyles from "./home-motion.module.css";

type Lang = "pt-BR" | "en" | "pt-PT" | "es" | "ja" | "zh";
type AvatarSource = "google" | "uploaded";
type CourseAccessStatus =
  "idle" | "checking" | "granted" | "pending" | "unavailable";
type ImageMetadata = Record<string, unknown>;
type StudentProfile = {
  user_id: string;
  display_name: string;
  full_name: string;
  country: string;
  favorite_programs: string[];
  language_code: Lang;
  avatar_path: string | null;
};
type MissionKey =
  | "profile_complete"
  | "lesson_01_complete"
  | "quiz_module_01_complete"
  | "simulator_used";
type MissionCompletion = {
  mission_key: MissionKey;
  xp_earned: number;
  completed_at: string;
};

const travelerTestimonials = [
  {
    image: "/testimonials/depoimento-01.png",
    alt: "Mensagem de viajante sobre realizar uma viagem em família",
    width: 1260,
    height: 465,
  },
  {
    image: "/testimonials/depoimento-02.png",
    alt: "Mensagem de viajante sobre colocar uma estratégia em prática",
    width: 1320,
    height: 387,
  },
  {
    image: "/testimonials/depoimento-03.png",
    alt: "Mensagem de viajante sobre aprender a usar melhor o cartão",
    width: 1217,
    height: 361,
  },
  {
    image: "/testimonials/depoimento-04.png",
    alt: "Mensagem de viajante sobre transferência de pontos",
    width: 1243,
    height: 371,
  },
  {
    image: "/testimonials/depoimento-05.png",
    alt: "Mensagem de viajante sobre realizar o primeiro cruzeiro",
    width: 1257,
    height: 397,
  },
];

function safeProfileImageUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function getGoogleProfileImage(user: User | null) {
  const metadata = (user?.user_metadata ?? {}) as ImageMetadata;
  const googleIdentity = user?.identities?.find(
    (identity) => identity.provider === "google",
  );
  const identityMetadata = (googleIdentity?.identity_data ??
    {}) as ImageMetadata;
  const candidates = [
    metadata.avatar_url,
    metadata.picture,
    metadata.google_avatar_url,
    identityMetadata.avatar_url,
    identityMetadata.picture,
  ];

  return (
    candidates
      .map(safeProfileImageUrl)
      .find((url): url is string => Boolean(url)) ?? null
  );
}
function readLanguage(): Lang {
  try {
    const saved = localStorage.getItem("domine-language");
    return (
      languageOptions.find((option) => option.code === saved)?.code ?? "pt-BR"
    );
  } catch {
    return "pt-BR";
  }
}
function subscribeLanguage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("domine-language-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("domine-language-change", callback);
  };
}
function serverLanguage(): Lang {
  return "pt-BR";
}
type IconName =
  | "home"
  | "book"
  | "calculator"
  | "target"
  | "user"
  | "bell"
  | "globe"
  | "arrowRight"
  | "arrowLeft"
  | "chevronDown"
  | "check"
  | "play"
  | "clock"
  | "spark"
  | "lock"
  | "mail"
  | "creditCard"
  | "pix"
  | "chart"
  | "trophy"
  | "settings"
  | "search"
  | "external"
  | "download"
  | "send"
  | "menu"
  | "close"
  | "zap"
  | "star"
  | "plane"
  | "info";

const languageOptions: {
  code: Lang;
  flag: string;
  label: string;
  native: string;
}[] = [
  {
    code: "pt-BR",
    flag: "BR",
    label: "Português (Brasil)",
    native: "Português",
  },
  { code: "en", flag: "US", label: "English", native: "English" },
  {
    code: "pt-PT",
    flag: "PT",
    label: "Português (Portugal)",
    native: "Português",
  },
  { code: "es", flag: "ES", label: "Español", native: "Español" },
  { code: "ja", flag: "JP", label: "日本語", native: "日本語" },
  { code: "zh", flag: "CN", label: "中文", native: "中文" },
];

// The product name follows the selected interface language too. Keeping the
// two visible lines together prevents a translated page from retaining a
// Portuguese-only brand lockup in its header, checkout, certificate or footer.
const localizedBrand: Record<Lang, { name: string; tagline: string }> = {
  "pt-BR": { name: "MILHAS ROTADAS", tagline: "DOMINE SUAS MILHAS" },
  en: { name: "ROTATED MILES", tagline: "MASTER YOUR MILES" },
  "pt-PT": { name: "MILHAS ROTATIVAS", tagline: "DOMINE AS SUAS MILHAS" },
  es: { name: "MILLAS ROTATIVAS", tagline: "DOMINA TUS MILLAS" },
  ja: { name: "巡るマイル", tagline: "マイルを極める" },
  zh: { name: "飞行里程", tagline: "掌握你的里程" },
};

const currencyByLanguage: Record<
  Lang,
  { locale: string; currency: string; label: string; fromBRL: number }
> = {
  "pt-BR": { locale: "pt-BR", currency: "BRL", label: "BRL", fromBRL: 1 },
  en: { locale: "en-US", currency: "USD", label: "USD", fromBRL: 0.18 },
  "pt-PT": { locale: "pt-PT", currency: "EUR", label: "EUR", fromBRL: 0.16 },
  es: { locale: "es-ES", currency: "EUR", label: "EUR", fromBRL: 0.16 },
  ja: { locale: "ja-JP", currency: "JPY", label: "JPY", fromBRL: 27 },
  zh: { locale: "zh-CN", currency: "CNY", label: "CNY", fromBRL: 1.3 },
};

function formatCurrency(value: number, language: Lang) {
  const { locale, currency, fromBRL } = currencyByLanguage[language];
  const fractionDigits = currency === "JPY" ? 0 : 2;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value * fromBRL);
}

function localizeCurrencyText(value: string, language: Lang) {
  if (language === "pt-BR") return value;
  return value.replace(/R\$\s?(\d+(?:[.,]\d+)?)/g, (_match, amount) =>
    formatCurrency(Number(String(amount).replace(",", ".")), language),
  );
}

type TranslationRow = [string, string, string, string, string, string];

// The visual prototype has many small labels inside cards and controls. Keeping
// them in one glossary lets the language picker translate the entire rendered
// experience, not only the large headings.
const visualTranslationRows: TranslationRow[] = [
  [
    "MILHAS ROTADAS",
    "ROTATED MILES",
    "MILHAS ROTATIVAS",
    "MILLAS ROTATIVAS",
    "巡るマイル",
    "飞行里程",
  ],
  [
    "DOMINE SUAS MILHAS",
    "MASTER YOUR MILES",
    "DOMINE AS SUAS MILHAS",
    "DOMINA TUS MILLAS",
    "マイルを極める",
    "掌握你的里程",
  ],
  [
    "Domine suas Milhas",
    "Master Your Miles",
    "Domine as suas Milhas",
    "Domina tus millas",
    "マイルを極める",
    "掌握你的里程",
  ],
  [
    "Milhas Rotadas — Domine suas Milhas",
    "Rotated Miles — Master Your Miles",
    "Milhas Rotativas — Domine as suas Milhas",
    "Millas Rotativas — Domina tus millas",
    "巡るマイル — マイルを極める",
    "飞行里程 — 掌握你的里程",
  ],
  [
    "Português (Brasil)",
    "Brazilian Portuguese",
    "Português (Brasil)",
    "Portugués (Brasil)",
    "ブラジルポルトガル語",
    "巴西葡萄牙语",
  ],
  [
    "Português (Portugal)",
    "European Portuguese",
    "Português (Portugal)",
    "Portugués (Portugal)",
    "ポルトガルポルトガル語",
    "欧洲葡萄牙语",
  ],
  [
    "EXPERIÊNCIA DE APRENDIZADO",
    "LEARNING EXPERIENCE",
    "EXPERIÊNCIA DE APRENDIZAGEM",
    "EXPERIENCIA DE APRENDIZAJE",
    "学習体験",
    "学习体验",
  ],
  [
    "Cena 3D interativa da capa",
    "Interactive 3D cover scene",
    "Cena 3D interativa da capa",
    "Escena 3D interactiva de portada",
    "インタラクティブな3Dカバーシーン",
    "互动式3D封面场景",
  ],
  [
    "Vista premium da asa de um avião sobre as nuvens",
    "Premium view of an airplane wing above the clouds",
    "Vista premium da asa de um avião sobre as nuvens",
    "Vista premium del ala de un avión sobre las nubes",
    "雲の上の飛行機の翼を映したプレミアムな眺め",
    "云层上方飞机机翼的高级视角",
  ],
  [
    "Explorar a plataforma",
    "Explore the platform",
    "Explorar a plataforma",
    "Explorar la plataforma",
    "プラットフォームを見る",
    "探索平台",
  ],
  [
    "Aprenda no seu ritmo",
    "Learn at your own pace",
    "Aprenda ao seu ritmo",
    "Aprende a tu ritmo",
    "自分のペースで学ぶ",
    "按自己的节奏学习",
  ],
  [
    "e viaje mais longe.",
    "and travel farther.",
    "e viaje mais longe.",
    "y viaja más lejos.",
    "もっと遠くへ旅しよう。",
    "去更远的地方。",
  ],
  ["ATIVO", "ACTIVE", "ATIVO", "ACTIVO", "有効", "已启用"],
  ["ORIGEM", "ORIGIN", "ORIGEM", "ORIGEN", "出発地", "出发地"],
  ["DESTINO", "DESTINATION", "DESTINO", "DESTINO", "目的地", "目的地"],
  ["São Paulo", "São Paulo", "São Paulo", "São Paulo", "サンパウロ", "圣保罗"],
  [
    "Paris, França",
    "Paris, France",
    "Paris, França",
    "París, Francia",
    "パリ、フランス",
    "法国巴黎",
  ],
  ["PASSAGEIRO", "PASSENGER", "PASSAGEIRO", "PASAJERO", "乗客", "乘客"],
  ["VALOR", "VALUE", "VALOR", "VALOR", "価値", "价值"],
  ["SEU SALDO", "YOUR BALANCE", "O SEU SALDO", "TU SALDO", "残高", "你的余额"],
  ["NÍVEL 03", "LEVEL 03", "NÍVEL 03", "NIVEL 03", "レベル03", "等级03"],
  ["Explorador", "Explorer", "Explorador", "Explorador", "探検家", "探索者"],
  [
    "Conhecimento que decola",
    "Knowledge that takes off",
    "Conhecimento que descola",
    "Conocimiento que despega",
    "知識が飛び立つ",
    "让知识起飞",
  ],
  [
    "De iniciante a",
    "From beginner to",
    "De iniciante a",
    "De principiante a",
    "初心者から",
    "从新手到",
  ],
  [
    "estrategista.",
    "strategist.",
    "estrategista.",
    "estratega.",
    "戦略家へ。",
    "策略家。",
  ],
  [
    "Uma jornada guiada para você tomar decisões melhores com seus pontos — sem complicação e sem achismo.",
    "A guided journey to make better decisions with your points — without complexity or guesswork.",
    "Uma jornada guiada para tomar melhores decisões com os seus pontos — sem complicações nem palpites.",
    "Un viaje guiado para tomar mejores decisiones con tus puntos, sin complicaciones ni suposiciones.",
    "ポイントについて、迷わずより良い選択ができるよう導く旅です。",
    "一段引导你用积分做出更好决策的旅程，不复杂也不靠猜。",
  ],
  ["Descobrir", "Discover", "Descobrir", "Descubrir", "発見", "发现"],
  ["Aplicar", "Apply", "Aplicar", "Aplicar", "実践", "应用"],
  ["Conquistar", "Achieve", "Conquistar", "Conquistar", "達成", "成就"],
  [
    "Uma jornada completa",
    "A complete journey",
    "Uma jornada completa",
    "Un viaje completo",
    "完全な旅",
    "完整旅程",
  ],
  [
    "— do básico ao avançado, com clareza em cada passo.",
    "— from beginner to advanced, with clarity at every step.",
    "— do básico ao avançado, com clareza em cada passo.",
    "— de lo básico a lo avanzado, con claridad en cada paso.",
    "— 基礎から上級まで、一歩ずつ明確に進めます。",
    "— 从基础到进阶，每一步都清晰明了。",
  ],
  ["Entrar", "Sign in", "Entrar", "Iniciar sesión", "ログイン", "登录"],
  [
    "Criar conta",
    "Create account",
    "Criar conta",
    "Crear cuenta",
    "アカウント作成",
    "创建账户",
  ],
  [
    "E-mail",
    "Email",
    "E-mail",
    "Correo electrónico",
    "メールアドレス",
    "电子邮件",
  ],
  [
    "Senha de acesso",
    "Access password",
    "Palavra-passe de acesso",
    "Contraseña de acceso",
    "アクセスパスワード",
    "访问密码",
  ],
  [
    "Esqueci minha senha",
    "I forgot my password",
    "Esqueci-me da palavra-passe",
    "Olvidé mi contraseña",
    "パスワードを忘れた",
    "忘记密码",
  ],
  [
    "RECUPERAÇÃO SEGURA",
    "SECURE RECOVERY",
    "RECUPERAÇÃO SEGURA",
    "RECUPERACIÓN SEGURA",
    "安全な復旧",
    "安全恢复",
  ],
  [
    "Defina uma nova senha",
    "Set a new password",
    "Defina uma nova palavra-passe",
    "Define una nueva contraseña",
    "新しいパスワードを設定",
    "设置新密码",
  ],
  [
    "Use uma senha exclusiva, com pelo menos 8 caracteres.",
    "Use a unique password with at least 8 characters.",
    "Use uma palavra-passe exclusiva, com pelo menos 8 caracteres.",
    "Usa una contraseña exclusiva de al menos 8 caracteres.",
    "8文字以上の固有のパスワードを使用してください。",
    "请使用至少 8 个字符的唯一密码。",
  ],
  [
    "Nova senha",
    "New password",
    "Nova palavra-passe",
    "Nueva contraseña",
    "新しいパスワード",
    "新密码",
  ],
  [
    "Confirmar nova senha",
    "Confirm new password",
    "Confirmar nova palavra-passe",
    "Confirmar nueva contraseña",
    "新しいパスワードを確認",
    "确认新密码",
  ],
  [
    "Atualizar senha",
    "Update password",
    "Atualizar palavra-passe",
    "Actualizar contraseña",
    "パスワードを更新",
    "更新密码",
  ],
  [
    "Senha atualizada",
    "Password updated",
    "Palavra-passe atualizada",
    "Contraseña actualizada",
    "パスワードを更新しました",
    "密码已更新",
  ],
  [
    "Sua nova senha foi salva. Entre novamente para continuar sua jornada.",
    "Your new password has been saved. Sign in again to continue your journey.",
    "A sua nova palavra-passe foi guardada. Inicie sessão novamente para continuar a sua jornada.",
    "Tu nueva contraseña se guardó. Inicia sesión de nuevo para continuar tu viaje.",
    "新しいパスワードが保存されました。もう一度ログインして学習を続けてください。",
    "新密码已保存。请重新登录以继续学习之旅。",
  ],
  [
    "Entrar com a nova senha",
    "Sign in with the new password",
    "Entrar com a nova palavra-passe",
    "Iniciar sesión con la nueva contraseña",
    "新しいパスワードでログイン",
    "使用新密码登录",
  ],
  [
    "Abra o link mais recente enviado ao seu e-mail para continuar.",
    "Open the most recent link sent to your email to continue.",
    "Abra a ligação mais recente enviada para o seu e-mail para continuar.",
    "Abre el enlace más reciente enviado a tu correo para continuar.",
    "続行するには、メールで届いた最新のリンクを開いてください。",
    "请打开已发送到您邮箱的最新链接以继续。",
  ],
  [
    "ou continue com",
    "or continue with",
    "ou continue com",
    "o continúa con",
    "または次で続ける",
    "或使用以下方式继续",
  ],
  [
    "Continuar com Google",
    "Continue with Google",
    "Continuar com o Google",
    "Continuar con Google",
    "Googleで続ける",
    "使用 Google 继续",
  ],
  [
    "ACESSO AO CURSO COMPLETO",
    "FULL COURSE ACCESS",
    "ACESSO AO CURSO COMPLETO",
    "ACCESO AL CURSO COMPLETO",
    "コース全体へのアクセス",
    "完整课程访问权限",
  ],
  [
    "Invista no seu próximo destino.",
    "Invest in your next destination.",
    "Invista no seu próximo destino.",
    "Invierte en tu próximo destino.",
    "次の目的地に投資しましょう。",
    "为下一段旅程投资。",
  ],
  [
    "{siteNotice[language].payment}",
    "After payment, you receive your access password by email. Access is verified automatically.",
    "Após o pagamento, recebe a palavra-passe de acesso por e-mail. A ativação é verificada automaticamente.",
    "Después del pago, recibirás tu contraseña de acceso por correo. El acceso se verifica automáticamente.",
    "支払い後、アクセスパスワードがメールで届きます。アクセスは自動で確認されます。",
    "付款后，访问密码会通过邮件发送。系统会自动验证访问权限。",
  ],
  [
    "Valor do acesso",
    "Access price",
    "Valor do acesso",
    "Precio del acceso",
    "アクセス料金",
    "访问价格",
  ],
  ["R$ [VALOR", "$ [AMOUNT", "€ [VALOR", "€ [VALOR", "¥ [金額", "¥ [金额"],
  [
    "NÃO ATRIBUÍDO]",
    "NOT ASSIGNED]",
    "NÃO ATRIBUÍDO]",
    "NO ASIGNADO]",
    "未設定]",
    "尚未指定]",
  ],
  [
    "Formas de pagamento",
    "Payment methods",
    "Métodos de pagamento",
    "Métodos de pago",
    "支払い方法",
    "付款方式",
  ],
  [
    "via Mercado Pago",
    "via Mercado Pago",
    "através do Mercado Pago",
    "a través de Mercado Pago",
    "Mercado Pago経由",
    "通过 Mercado Pago",
  ],
  ["PIX", "PIX", "PIX", "PIX", "PIX", "PIX"],
  [
    "recomendado",
    "recommended",
    "recomendado",
    "recomendado",
    "おすすめ",
    "推荐",
  ],
  [
    "Aprovação imediata • acesso na hora",
    "Instant approval • immediate access",
    "Aprovação imediata • acesso imediato",
    "Aprobación inmediata • acceso al instante",
    "即時承認 • すぐにアクセス",
    "即时批准 • 立即访问",
  ],
  [
    "Cartão de crédito",
    "Credit card",
    "Cartão de crédito",
    "Tarjeta de crédito",
    "クレジットカード",
    "信用卡",
  ],
  [
    "Todos os países • até 24h",
    "All countries • up to 24h",
    "Todos os países • até 24 horas",
    "Todos los países • hasta 24 horas",
    "すべての国 • 最大24時間",
    "所有国家 • 最多24小时",
  ],
  [
    "Para usuários internacionais:",
    "For international users:",
    "Para utilizadores internacionais:",
    "Para usuarios internacionales:",
    "海外ユーザーへ：",
    "国际用户：",
  ],
  [
    "o Pix está disponível apenas no Brasil. Use cartão de crédito.",
    "Pix is available only in Brazil. Use a credit card.",
    "o Pix está disponível apenas no Brasil. Utilize cartão de crédito.",
    "Pix solo está disponible en Brasil. Usa una tarjeta de crédito.",
    "Pixはブラジルでのみ利用できます。クレジットカードをご利用ください。",
    "Pix 仅在巴西可用。请使用信用卡。",
  ],
  ["Legenda", "Legend", "Legenda", "Leyenda", "凡例", "图例"],
  [
    "Mais fácil e rápido",
    "Easier and faster",
    "Mais fácil e rápido",
    "Más fácil y rápido",
    "より簡単で速い",
    "更简单、更快速",
  ],
  [
    "Disponível com limitações",
    "Available with limitations",
    "Disponível com limitações",
    "Disponible con limitaciones",
    "制限付きで利用可能",
    "有限制可用",
  ],
  [
    "PRIMEIRO ACESSO",
    "FIRST LOGIN",
    "PRIMEIRO ACESSO",
    "PRIMER ACCESO",
    "初回アクセス",
    "首次访问",
  ],
  [
    "Olá, João!",
    "Hello, João!",
    "Olá, João!",
    "¡Hola, João!",
    "こんにちは、Joãoさん！",
    "你好，João！",
  ],
  [
    "Sua jornada no mundo das milhas começa agora. Preparamos um primeiro passo simples para você sentir a evolução.",
    "Your journey into the world of miles starts now. We prepared a simple first step so you can feel your progress.",
    "A sua jornada no mundo das milhas começa agora. Preparámos um primeiro passo simples para sentir a sua evolução.",
    "Tu viaje en el mundo de las millas comienza ahora. Preparamos un primer paso sencillo para que sientas tu evolución.",
    "マイルの世界への旅が今始まります。成長を実感できるシンプルな第一歩を用意しました。",
    "你的里程之旅现在开始。我们准备了简单的第一步，让你感受进步。",
  ],
  [
    "Começar curso",
    "Start course",
    "Começar curso",
    "Comenzar curso",
    "コースを始める",
    "开始课程",
  ],
  ["Módulos", "Modules", "Módulos", "Módulos", "モジュール", "模块"],
  ["Aulas", "Lessons", "Aulas", "Clases", "レッスン", "课程"],
  ["Conquistas", "Achievements", "Conquistas", "Logros", "実績", "成就"],
  [
    "SEU PONTO DE PARTIDA",
    "YOUR STARTING POINT",
    "O SEU PONTO DE PARTIDA",
    "TU PUNTO DE PARTIDA",
    "スタート地点",
    "你的起点",
  ],
  [
    "EM ANDAMENTO",
    "IN PROGRESS",
    "EM CURSO",
    "EN PROGRESO",
    "進行中",
    "进行中",
  ],
  ["nível", "level", "nível", "nivel", "レベル", "等级"],
  [
    "NÍVEL ATUAL",
    "CURRENT LEVEL",
    "NÍVEL ATUAL",
    "NIVEL ACTUAL",
    "現在のレベル",
    "当前等级",
  ],
  ["Iniciante", "Beginner", "Iniciante", "Principiante", "初心者", "新手"],
  [
    "0 / 100 XP para o próximo nível",
    "0 / 100 XP to the next level",
    "0 / 100 XP para o nível seguinte",
    "0 / 100 XP para el siguiente nivel",
    "次のレベルまで0 / 100 XP",
    "距离下一级 0 / 100 XP",
  ],
  [
    "SUA PRIMEIRA MISSÃO",
    "YOUR FIRST MISSION",
    "A SUA PRIMEIRA MISSÃO",
    "TU PRIMERA MISIÓN",
    "最初のミッション",
    "你的第一个任务",
  ],
  [
    "Assista à primeira aula do módulo 1",
    "Watch the first lesson of module 1",
    "Assista à primeira aula do módulo 1",
    "Mira la primera clase del módulo 1",
    "モジュール1の最初のレッスンを見る",
    "观看模块1的第一课",
  ],
  [
    "QUARTA-FEIRA, 18 SET 2026",
    "WEDNESDAY, SEP 18, 2026",
    "QUARTA-FEIRA, 18 SET 2026",
    "MIÉRCOLES, 18 SEP 2026",
    "2026年9月18日 水曜日",
    "2026年9月18日 星期三",
  ],
  [
    "Bom dia, João",
    "Good morning, João",
    "Bom dia, João",
    "Buenos días, João",
    "おはようございます、Joãoさん",
    "早上好，João",
  ],
  [
    "Ver mapa do curso",
    "View course map",
    "Ver mapa do curso",
    "Ver mapa del curso",
    "コースマップを見る",
    "查看课程地图",
  ],
  [
    "PROGRESSO DO CURSO",
    "COURSE PROGRESS",
    "PROGRESSO DO CURSO",
    "PROGRESO DEL CURSO",
    "コースの進捗",
    "课程进度",
  ],
  ["XP TOTAL", "TOTAL XP", "XP TOTAL", "XP TOTAL", "合計XP", "总 XP"],
  [
    "Nível 3 • Intermediário",
    "Level 3 • Intermediate",
    "Nível 3 • Intermédio",
    "Nivel 3 • Intermedio",
    "レベル3 • 中級",
    "等级3 • 中级",
  ],
  [
    "+1 nesta semana",
    "+1 this week",
    "+1 esta semana",
    "+1 esta semana",
    "今週 +1",
    "本周 +1",
  ],
  [
    "PRÓXIMA AULA",
    "NEXT LESSON",
    "PRÓXIMA AULA",
    "PRÓXIMA CLASE",
    "次のレッスン",
    "下一课",
  ],
  [
    "MÓDULO 02",
    "MODULE 02",
    "MÓDULO 02",
    "MÓDULO 02",
    "モジュール02",
    "模块02",
  ],
  [
    "Como funcionam os programas Smiles e TudoAzul",
    "How Smiles and TudoAzul programs work",
    "Como funcionam os programas Smiles e TudoAzul",
    "Cómo funcionan los programas Smiles y TudoAzul",
    "SmilesとTudoAzulの仕組み",
    "Smiles 和 TudoAzul 计划如何运作",
  ],
  [
    "Entenda os diferenciais e escolha onde concentrar seus pontos.",
    "Understand the differences and choose where to focus your points.",
    "Compreenda as diferenças e escolha onde concentrar os seus pontos.",
    "Entiende las diferencias y elige dónde concentrar tus puntos.",
    "違いを理解し、ポイントを集中させる先を選びましょう。",
    "了解差异，选择集中积分的地方。",
  ],
  [
    "Vídeo-aula",
    "Video lesson",
    "Vídeo-aula",
    "Vídeo-clase",
    "ビデオレッスン",
    "视频课程",
  ],
  ["Continuar", "Continue", "Continuar", "Continuar", "続ける", "继续"],
  [
    "Missões da semana",
    "Weekly missions",
    "Missões da semana",
    "Misiones de la semana",
    "今週のミッション",
    "本周任务",
  ],
  ["Ver todas", "View all", "Ver todas", "Ver todas", "すべて見る", "查看全部"],
  [
    "Complete seu perfil",
    "Complete your profile",
    "Complete o seu perfil",
    "Completa tu perfil",
    "プロフィールを完成させる",
    "完善个人资料",
  ],
  [
    "Veja a aula 01",
    "Watch lesson 01",
    "Veja a aula 01",
    "Mira la clase 01",
    "レッスン01を見る",
    "观看第01课",
  ],
  [
    "Faça o quiz do módulo 01",
    "Take the module 01 quiz",
    "Faça o quiz do módulo 01",
    "Haz el cuestionario del módulo 01",
    "モジュール01のクイズに挑戦",
    "完成模块01测验",
  ],
  [
    "ACELERE SEU PROGRESSO",
    "SPEED UP YOUR PROGRESS",
    "ACELERE O SEU PROGRESSO",
    "ACELERA TU PROGRESO",
    "進捗を加速",
    "加速你的进度",
  ],
  [
    "Uma missão por dia.",
    "One mission a day.",
    "Uma missão por dia.",
    "Una misión al día.",
    "1日1ミッション。",
    "每天一个任务。",
  ],
  [
    "Uma viagem mais perto.",
    "One trip closer.",
    "Uma viagem mais perto.",
    "Un viaje más cerca.",
    "旅が一歩近づく。",
    "离旅行更近一步。",
  ],
  [
    "Conquistas recentes",
    "Recent achievements",
    "Conquistas recentes",
    "Logros recientes",
    "最近の実績",
    "近期成就",
  ],
  [
    "Primeira aula",
    "First lesson",
    "Primeira aula",
    "Primera clase",
    "最初のレッスン",
    "第一课",
  ],
  [
    "Primeiro módulo",
    "First module",
    "Primeiro módulo",
    "Primer módulo",
    "最初のモジュール",
    "第一个模块",
  ],
  [
    "100% foco",
    "100% focus",
    "100% foco",
    "100% enfoque",
    "100%集中",
    "100%专注",
  ],
  [
    "Caçador de bônus",
    "Bonus hunter",
    "Caçador de bónus",
    "Cazador de bonos",
    "ボーナスハンター",
    "奖励猎人",
  ],
  [
    "SUA TRILHA DE APRENDIZADO",
    "YOUR LEARNING PATH",
    "O SEU PERCURSO DE APRENDIZAGEM",
    "TU RUTA DE APRENDIZAJE",
    "学習の道のり",
    "你的学习路径",
  ],
  [
    "Do primeiro ponto ao resgate perfeito.",
    "From your first point to the perfect redemption.",
    "Do primeiro ponto ao resgate perfeito.",
    "Del primer punto al canje perfecto.",
    "最初のポイントから理想の交換まで。",
    "从第一积分到完美兑换。",
  ],
  [
    "Avance pelos módulos e desbloqueie novas estratégias.",
    "Move through the modules and unlock new strategies.",
    "Avance pelos módulos e desbloqueie novas estratégias.",
    "Avanza por los módulos y desbloquea nuevas estrategias.",
    "モジュールを進み、新しい戦略を解放しましょう。",
    "完成模块，解锁新策略。",
  ],
  [
    "MAPA DO CURSO",
    "COURSE MAP",
    "MAPA DO CURSO",
    "MAPA DEL CURSO",
    "コースマップ",
    "课程地图",
  ],
  ["Todos", "All", "Todos", "Todos", "すべて", "全部"],
  ["Concluídos", "Completed", "Concluídos", "Completados", "完了", "已完成"],
  [
    "Em andamento",
    "In progress",
    "Em curso",
    "En progreso",
    "進行中",
    "进行中",
  ],
  ["Bloqueados", "Locked", "Bloqueados", "Bloqueados", "ロック中", "已锁定"],
  ["Concluído", "Completed", "Concluído", "Completado", "完了", "已完成"],
  ["Disponível", "Available", "Disponível", "Disponible", "利用可能", "可用"],
  ["Bloqueado", "Locked", "Bloqueado", "Bloqueado", "ロック中", "已锁定"],
  [
    "Dica de especialista:",
    "Expert tip:",
    "Dica de especialista:",
    "Consejo de experto:",
    "専門家のヒント：",
    "专家提示：",
  ],
  [
    "não tenha pressa. A consistência vale mais que a velocidade.",
    "do not rush. Consistency matters more than speed.",
    "não tenha pressa. A consistência vale mais do que a velocidade.",
    "no tengas prisa. La constancia vale más que la velocidad.",
    "急がないでください。速さより継続が大切です。",
    "不要着急，坚持比速度更重要。",
  ],
  ["Curso", "Course", "Curso", "Curso", "コース", "课程"],
  [
    "Módulo 02",
    "Module 02",
    "Módulo 02",
    "Módulo 02",
    "モジュール02",
    "模块02",
  ],
  ["Aula 02", "Lesson 02", "Aula 02", "Clase 02", "レッスン02", "第02课"],
  [
    "Programas de fidelidade",
    "Loyalty programs",
    "Programas de fidelização",
    "Programas de fidelización",
    "ロイヤルティプログラム",
    "忠诚度计划",
  ],
  [
    "Agora que você entendeu a lógica dos pontos, é hora de conhecer os dois maiores programas nacionais e descobrir onde cada um pode levar você.",
    "Now that you understand how points work, it is time to meet the two largest national programs and discover where each can take you.",
    "Agora que percebeu a lógica dos pontos, está na hora de conhecer os dois maiores programas nacionais e descobrir onde cada um o pode levar.",
    "Ahora que entiendes la lógica de los puntos, es hora de conocer los dos mayores programas nacionales y descubrir adónde puede llevarte cada uno.",
    "ポイントの仕組みを理解したら、国内最大の2つのプログラムを知り、それぞれがどこへ導くか見てみましょう。",
    "了解积分逻辑后，现在认识两个最大的国内计划，看看它们各自能带你去哪里。",
  ],
  [
    "Marcar como concluída",
    "Mark as complete",
    "Marcar como concluída",
    "Marcar como completada",
    "完了としてマーク",
    "标记为完成",
  ],
  [
    "CONTEÚDO DA AULA",
    "LESSON CONTENT",
    "CONTEÚDO DA AULA",
    "CONTENIDO DE LA CLASE",
    "レッスン内容",
    "课程内容",
  ],
  [
    "O que são programas?",
    "What are programs?",
    "O que são programas?",
    "¿Qué son los programas?",
    "プログラムとは？",
    "什么是计划？",
  ],
  [
    "Concluído • 04:20",
    "Completed • 04:20",
    "Concluído • 04:20",
    "Completado • 04:20",
    "完了 • 04:20",
    "已完成 • 04:20",
  ],
  [
    "Smiles e TudoAzul",
    "Smiles and TudoAzul",
    "Smiles e TudoAzul",
    "Smiles y TudoAzul",
    "SmilesとTudoAzul",
    "Smiles 和 TudoAzul",
  ],
  [
    "Em andamento • 15:08",
    "In progress • 15:08",
    "Em curso • 15:08",
    "En progreso • 15:08",
    "進行中 • 15:08",
    "进行中 • 15:08",
  ],
  [
    "Clubes e assinaturas",
    "Clubs and subscriptions",
    "Clubes e subscrições",
    "Clubes y suscripciones",
    "クラブとサブスクリプション",
    "俱乐部和订阅",
  ],
  [
    "Próxima aula • 08:45",
    "Next lesson • 08:45",
    "Próxima aula • 08:45",
    "Próxima clase • 08:45",
    "次のレッスン • 08:45",
    "下一课 • 08:45",
  ],
  [
    "Qual escolher?",
    "Which one to choose?",
    "Qual escolher?",
    "¿Cuál elegir?",
    "どれを選ぶ？",
    "选择哪一个？",
  ],
  [
    "Próxima aula • 12:30",
    "Next lesson • 12:30",
    "Próxima aula • 12:30",
    "Próxima clase • 12:30",
    "次のレッスン • 12:30",
    "下一课 • 12:30",
  ],
  [
    "Resumo do módulo",
    "Module summary",
    "Resumo do módulo",
    "Resumen del módulo",
    "モジュールのまとめ",
    "模块总结",
  ],
  [
    "Quiz • 05 questões",
    "Quiz • 05 questions",
    "Quiz • 05 perguntas",
    "Cuestionario • 05 preguntas",
    "クイズ • 05問",
    "测验 • 05题",
  ],
  [
    "Você pode voltar aqui quando quiser. Seu progresso fica salvo.",
    "You can come back here whenever you want. Your progress is saved.",
    "Pode voltar aqui quando quiser. O seu progresso fica guardado.",
    "Puedes volver aquí cuando quieras. Tu progreso queda guardado.",
    "いつでもここに戻れます。進捗は保存されます。",
    "你可以随时回来。进度会被保存。",
  ],
  [
    "Simulador",
    "Simulator",
    "Simulador",
    "Simulador",
    "シミュレーター",
    "模拟器",
  ],
  [
    "Comparador",
    "Comparator",
    "Comparador",
    "Comparador",
    "比較ツール",
    "比较器",
  ],
  [
    "Dados demonstrativos",
    "Demo data",
    "Dados demonstrativos",
    "Datos de demostración",
    "デモデータ",
    "演示数据",
  ],
  [
    "SIMULADOR DE ACÚMULO",
    "EARNING SIMULATOR",
    "SIMULADOR DE ACUMULAÇÃO",
    "SIMULADOR DE ACUMULACIÓN",
    "獲得シミュレーター",
    "积分累积模拟器",
  ],
  [
    "Quanto você pode acumular?",
    "How much can you earn?",
    "Quanto pode acumular?",
    "¿Cuánto puedes acumular?",
    "どれくらい貯められる？",
    "你能累积多少？",
  ],
  [
    "Ajuste os valores e veja uma estimativa de pontos para o seu perfil.",
    "Adjust the values and see an estimated points total for your profile.",
    "Ajuste os valores e veja uma estimativa de pontos para o seu perfil.",
    "Ajusta los valores y mira una estimación de puntos para tu perfil.",
    "数値を調整して、あなたのプロフィールのポイント予測を確認しましょう。",
    "调整数值，查看适合你情况的积分估算。",
  ],
  [
    "Gastos mensais no cartão",
    "Monthly card spending",
    "Gastos mensais no cartão",
    "Gastos mensuales con tarjeta",
    "カードの月間利用額",
    "每月信用卡消费",
  ],
  [
    "Multiplicador médio",
    "Average multiplier",
    "Multiplicador médio",
    "Multiplicador medio",
    "平均倍率",
    "平均倍数",
  ],
  [
    "Inclua compras bonificadas para uma projeção ainda melhor.",
    "Include bonus purchases for an even better projection.",
    "Inclua compras bonificadas para uma projeção ainda melhor.",
    "Incluye compras bonificadas para una proyección aún mejor.",
    "ボーナス対象の購入を含めると、さらに良い予測になります。",
    "加入奖励消费，预测会更准确。",
  ],
  [
    "Atualizar projeção",
    "Update projection",
    "Atualizar projeção",
    "Actualizar proyección",
    "予測を更新",
    "更新预测",
  ],
  [
    "SUA PROJEÇÃO EM 12 MESES",
    "YOUR 12-MONTH PROJECTION",
    "A SUA PROJEÇÃO EM 12 MESES",
    "TU PROYECCIÓN EN 12 MESES",
    "12か月の予測",
    "你的12个月预测",
  ],
  [
    "+12% potencial",
    "+12% potential",
    "+12% de potencial",
    "+12% de potencial",
    "+12%の可能性",
    "+12%潜力",
  ],
  ["pontos", "points", "pontos", "puntos", "ポイント", "积分"],
  [
    "Com esse ritmo, você pode chegar mais perto de uma passagem de ida e volta para",
    "At this pace, you can get closer to a round-trip ticket to",
    "A este ritmo, pode ficar mais perto de uma viagem de ida e volta para",
    "A este ritmo, puedes acercarte a un billete de ida y vuelta a",
    "このペースなら、往復航空券に近づけます：",
    "按这个速度，你可以更接近一张往返机票：",
  ],
  [
    "Buenos Aires",
    "Buenos Aires",
    "Buenos Aires",
    "Buenos Aires",
    "ブエノスアイレス",
    "布宜诺斯艾利斯",
  ],
  ["Por mês", "Per month", "Por mês", "Por mes", "月あたり", "每月"],
  [
    "Valor estimado",
    "Estimated value",
    "Valor estimado",
    "Valor estimado",
    "推定価値",
    "预计价值",
  ],
  ["Equivale a", "Equivalent to", "Equivale a", "Equivale a", "相当", "相当于"],
  ["1 viagem", "1 trip", "1 viagem", "1 viagem", "1回の旅行", "1次旅行"],
  [
    "Quer aprender a multiplicar esse resultado?",
    "Want to learn how to multiply this result?",
    "Quer aprender a multiplicar este resultado?",
    "¿Quieres aprender a multiplicar este resultado?",
    "この結果をさらに増やす方法を学びませんか？",
    "想学习如何放大这个结果吗？",
  ],
  [
    "Buscar programa",
    "Search program",
    "Pesquisar programa",
    "Buscar programa",
    "プログラムを検索",
    "搜索计划",
  ],
  [
    "COMPARADOR DE PROGRAMAS",
    "PROGRAM COMPARATOR",
    "COMPARADOR DE PROGRAMAS",
    "COMPARADOR DE PROGRAMAS",
    "プログラム比較",
    "计划比较器",
  ],
  [
    "Qual programa combina com você?",
    "Which program fits you?",
    "Qual é o programa ideal para si?",
    "¿Qué programa combina contigo?",
    "あなたに合うプログラムは？",
    "哪个计划适合你？",
  ],
  [
    "Compare os pontos fortes e escolha com mais segurança.",
    "Compare strengths and choose with confidence.",
    "Compare os pontos fortes e escolha com mais segurança.",
    "Compara los puntos fuertes y elige con más seguridad.",
    "強みを比較して、自信を持って選びましょう。",
    "比较优势，更有把握地选择。",
  ],
  [
    "Seu objetivo",
    "Your goal",
    "O seu objetivo",
    "Tu objetivo",
    "あなたの目標",
    "你的目标",
  ],
  [
    "Viajar para fora",
    "Travel abroad",
    "Viajar para o estrangeiro",
    "Viajar al extranjero",
    "海外旅行",
    "出国旅行",
  ],
  ["PROGRAMAS", "PROGRAMS", "PROGRAMAS", "PROGRAMAS", "プログラム", "计划"],
  ["ACÚMULO", "EARNING", "ACUMULAÇÃO", "ACUMULACIÓN", "獲得", "累积"],
  ["RESGATE", "REDEMPTION", "RESGATE", "CANJE", "交換", "兑换"],
  ["BENEFÍCIOS", "BENEFITS", "BENEFÍCIOS", "BENEFICIOS", "特典", "权益"],
  [
    "RECOMENDADO",
    "RECOMMENDED",
    "RECOMENDADO",
    "RECOMENDADO",
    "おすすめ",
    "推荐",
  ],
  [
    "Insight do Domine:",
    "Domine insight:",
    "Insight do Domine:",
    "Insight de Domine:",
    "Domineからのヒント：",
    "Domine 提示：",
  ],
  [
    "centralizar pontos na Livelo pode dar mais flexibilidade na hora de transferir com bônus.",
    "centralizing points in Livelo can give you more flexibility when transferring with bonuses.",
    "centralizar pontos na Livelo pode dar mais flexibilidade ao transferir com bónus.",
    "centralizar puntos en Livelo puede darte más flexibilidad al transferir con bonos.",
    "Liveloにポイントを集めると、ボーナス移行時の柔軟性が高まります。",
    "将积分集中在 Livelo，可在奖励转移时获得更多灵活性。",
  ],
  [
    "Aprender mais",
    "Learn more",
    "Saber mais",
    "Aprender más",
    "詳しく学ぶ",
    "了解更多",
  ],
  [
    "CENTRAL DE MISSÕES",
    "MISSION HUB",
    "CENTRO DE MISSÕES",
    "CENTRO DE MISIONES",
    "ミッションセンター",
    "任务中心",
  ],
  [
    "Transforme intenção em hábito.",
    "Turn intention into a habit.",
    "Transforme a intenção em hábito.",
    "Convierte la intención en hábito.",
    "意志を習慣に変えよう。",
    "把意愿变成习惯。",
  ],
  [
    "Complete ações pequenas e acumule XP para desbloquear novas conquistas.",
    "Complete small actions and earn XP to unlock new achievements.",
    "Complete pequenas ações e acumule XP para desbloquear novas conquistas.",
    "Completa pequeñas acciones y gana XP para desbloquear nuevos logros.",
    "小さな行動を完了してXPを獲得し、新しい実績を解放しましょう。",
    "完成小行动并获得 XP，解锁新的成就。",
  ],
  ["ESTA SEMANA", "THIS WEEK", "ESTA SEMANA", "ESTA SEMANA", "今週", "本周"],
  ["Concluídas", "Completed", "Concluídas", "Completadas", "完了", "已完成"],
  [
    "3 dias de sequência",
    "3-day streak",
    "3 dias consecutivos",
    "3 días seguidos",
    "3日連続",
    "连续3天",
  ],
  ["CONCLUÍDA", "COMPLETED", "CONCLUÍDA", "COMPLETADA", "完了", "已完成"],
  ["DIAS", "DAYS", "DIAS", "DÍAS", "日", "天"],
  [
    "VOCÊ ESTÁ PEGANDO RITMO",
    "YOU ARE BUILDING MOMENTUM",
    "ESTÁ A GANHAR RITMO",
    "ESTÁS TOMANDO RITMO",
    "調子が出てきました",
    "你正在进入状态",
  ],
  [
    "Continue por mais 4 dias e ganhe a medalha “Constância”.",
    "Continue for 4 more days and earn the “Consistency” badge.",
    "Continue por mais 4 dias e ganhe a medalha “Consistência”.",
    "Continúa 4 días más y gana la medalla “Constancia”.",
    "あと4日続けて「継続」のメダルを獲得しましょう。",
    "再坚持4天，获得“坚持”徽章。",
  ],
  [
    "QUIZ · MÓDULO 01",
    "QUIZ · MODULE 01",
    "QUIZ · MÓDULO 01",
    "CUESTIONARIO · MÓDULO 01",
    "クイズ · モジュール01",
    "测验 · 模块01",
  ],
  [
    "Questão 03",
    "Question 03",
    "Questão 03",
    "Pregunta 03",
    "問題03",
    "问题03",
  ],
  [
    "60% concluído",
    "60% complete",
    "60% concluído",
    "60% completado",
    "60%完了",
    "已完成60%",
  ],
  [
    "ESCOLHA UMA ALTERNATIVA",
    "CHOOSE ONE ANSWER",
    "ESCOLHA UMA ALTERNATIVA",
    "ELIGE UNA ALTERNATIVA",
    "答えを1つ選択",
    "选择一个答案",
  ],
  [
    "Qual é o melhor momento para transferir seus pontos para um programa de milhas?",
    "When is the best time to transfer your points to a miles program?",
    "Qual é o melhor momento para transferir os seus pontos para um programa de milhas?",
    "¿Cuál es el mejor momento para transferir tus puntos a un programa de millas?",
    "ポイントをマイルプログラムへ移行する最適なタイミングは？",
    "什么时候是将积分转入里程计划的最佳时机？",
  ],
  [
    "Uma boa estratégia pode aumentar muito o valor do seu saldo.",
    "A good strategy can greatly increase the value of your balance.",
    "Uma boa estratégia pode aumentar muito o valor do seu saldo.",
    "Una buena estrategia puede aumentar mucho el valor de tu saldo.",
    "良い戦略で残高の価値を大きく高められます。",
    "好的策略可以大幅提升余额价值。",
  ],
  [
    "Limpar resposta",
    "Clear answer",
    "Limpar resposta",
    "Borrar respuesta",
    "回答をクリア",
    "清除答案",
  ],
  [
    "Confirmar resposta",
    "Confirm answer",
    "Confirmar resposta",
    "Confirmar respuesta",
    "回答を確定",
    "确认答案",
  ],
  [
    "PROJETO FINAL · DESAFIO 01",
    "FINAL PROJECT · CHALLENGE 01",
    "PROJETO FINAL · DESAFIO 01",
    "PROYECTO FINAL · DESAFÍO 01",
    "最終プロジェクト · チャレンジ01",
    "最终项目 · 挑战01",
  ],
  [
    "Planeje sua próxima viagem com milhas.",
    "Plan your next trip with miles.",
    "Planeie a sua próxima viagem com milhas.",
    "Planifica tu próximo viaje con millas.",
    "マイルで次の旅を計画しましょう。",
    "用里程规划下一次旅行。",
  ],
  [
    "Chegou a hora de juntar tudo o que você aprendeu em um plano que faz sentido para você.",
    "It is time to bring everything you learned together in a plan that works for you.",
    "Chegou a altura de juntar tudo o que aprendeu num plano que faça sentido para si.",
    "Es hora de reunir todo lo aprendido en un plan que tenga sentido para ti.",
    "学んだことを、あなたに合う計画にまとめる時です。",
    "现在是把所学整合成适合你的计划的时候。",
  ],
  ["RECOMPENSA", "REWARD", "RECOMPENSA", "RECOMPENSA", "報酬", "奖励"],
  [
    "SEU BRIEFING",
    "YOUR BRIEF",
    "O SEU BRIEFING",
    "TU BRIEFING",
    "あなたの概要",
    "你的任务简报",
  ],
  [
    "Uma viagem para duas pessoas",
    "A trip for two",
    "Uma viagem para duas pessoas",
    "Un viaje para dos personas",
    "2人の旅行",
    "两人旅行",
  ],
  [
    "Destino dos sonhos",
    "Dream destination",
    "Destino de sonho",
    "Destino soñado",
    "夢の目的地",
    "梦想目的地",
  ],
  [
    "Lisboa, Portugal",
    "Lisbon, Portugal",
    "Lisboa, Portugal",
    "Lisboa, Portugal",
    "リスボン、ポルトガル",
    "葡萄牙里斯本",
  ],
  ["Período", "Travel period", "Período", "Periodo", "旅行期間", "出行时间"],
  [
    "Outubro 2026",
    "October 2026",
    "Outubro de 2026",
    "Octubre de 2026",
    "2026年10月",
    "2026年10月",
  ],
  ["Orçamento", "Budget", "Orçamento", "Presupuesto", "予算", "预算"],
  [
    "Saldo atual",
    "Current balance",
    "Saldo atual",
    "Saldo actual",
    "現在の残高",
    "当前余额",
  ],
  [
    "CHECKLIST DO PROJETO",
    "PROJECT CHECKLIST",
    "CHECKLIST DO PROJETO",
    "LISTA DEL PROYECTO",
    "プロジェクトチェックリスト",
    "项目清单",
  ],
  [
    "Definir destino e período",
    "Define destination and dates",
    "Definir destino e período",
    "Definir destino y periodo",
    "目的地と期間を決める",
    "确定目的地和时间",
  ],
  [
    "Escolher o melhor programa",
    "Choose the best program",
    "Escolher o melhor programa",
    "Elegir el mejor programa",
    "最適なプログラムを選ぶ",
    "选择最佳计划",
  ],
  [
    "Encontrar a melhor rota",
    "Find the best route",
    "Encontrar a melhor rota",
    "Encontrar la mejor ruta",
    "最適なルートを探す",
    "找到最佳路线",
  ],
  [
    "Calcular pontos necessários",
    "Calculate required points",
    "Calcular os pontos necessários",
    "Calcular los puntos necesarios",
    "必要なポイントを計算",
    "计算所需积分",
  ],
  ["Em aberto", "Open", "Em aberto", "Pendiente", "未完了", "待处理"],
  [
    "Continuar projeto",
    "Continue project",
    "Continuar projeto",
    "Continuar proyecto",
    "プロジェクトを続ける",
    "继续项目",
  ],
  [
    "SUA ROTA",
    "YOUR ROUTE",
    "A SUA ROTA",
    "TU RUTA",
    "あなたのルート",
    "你的路线",
  ],
  ["Lisboa", "Lisbon", "Lisboa", "Lisboa", "リスボン", "里斯本"],
  [
    "1 conexão",
    "1 connection",
    "1 escala",
    "1 conexión",
    "乗り継ぎ1回",
    "1次中转",
  ],
  [
    "8.7k milhas",
    "8.7k miles",
    "8,7 mil milhas",
    "8,7 mil millas",
    "8.7kマイル",
    "8.7k里程",
  ],
  [
    "DICA DO COACH",
    "COACH TIP",
    "DICA DO COACH",
    "CONSEJO DEL COACH",
    "コーチのヒント",
    "教练提示",
  ],
  [
    "Flexibilizar 2 dias pode economizar até",
    "Being flexible by 2 days can save up to",
    "Ser flexível em 2 dias pode poupar até",
    "Ser flexible 2 días puede ahorrar hasta",
    "2日柔軟にすると最大",
    "灵活调整2天最多可节省",
  ],
  [
    "30% dos pontos.",
    "30% of the points.",
    "30% dos pontos.",
    "el 30% de los puntos.",
    "ポイントの30%。",
    "30%的积分。",
  ],
  [
    "SEU NÍVEL ATUAL",
    "YOUR CURRENT LEVEL",
    "O SEU NÍVEL ATUAL",
    "TU NIVEL ACTUAL",
    "現在のレベル",
    "你的当前等级",
  ],
  [
    "250 XP acumulados nesta jornada",
    "250 XP earned on this journey",
    "250 XP acumulados nesta jornada",
    "250 XP acumulados en este viaje",
    "この旅で250 XP獲得",
    "本次旅程已获得250 XP",
  ],
  ["Nível 3", "Level 3", "Nível 3", "Nivel 3", "レベル3", "等级3"],
  ["Nível 4", "Level 4", "Nível 4", "Nivel 4", "レベル4", "等级4"],
  [
    "módulos concluídos",
    "modules completed",
    "módulos concluídos",
    "módulos completados",
    "完了したモジュール",
    "已完成模块",
  ],
  [
    "aulas assistidas",
    "lessons watched",
    "aulas assistidas",
    "clases vistas",
    "視聴したレッスン",
    "已观看课程",
  ],
  ["de progresso", "progress", "de progresso", "de progreso", "進捗", "进度"],
  ["COLEÇÃO", "COLLECTION", "COLEÇÃO", "COLECCIÓN", "コレクション", "收藏"],
  [
    "Você começou!",
    "You started!",
    "Começou!",
    "¡Has comenzado!",
    "始めました！",
    "你已经开始了！",
  ],
  [
    "Leitor voraz",
    "Avid learner",
    "Leitor ávido",
    "Lector voraz",
    "熱心な学習者",
    "勤奋学习者",
  ],
  [
    "1º módulo completo",
    "1st module complete",
    "1.º módulo completo",
    "1.er módulo completo",
    "第1モジュール完了",
    "第1模块完成",
  ],
  [
    "7 dias seguidos",
    "7 days in a row",
    "7 dias seguidos",
    "7 días seguidos",
    "7日連続",
    "连续7天",
  ],
  [
    "Em missão",
    "On a mission",
    "Em missão",
    "En misión",
    "ミッション中",
    "任务中",
  ],
  [
    "3 desafios feitos",
    "3 challenges completed",
    "3 desafios concluídos",
    "3 desafíos completados",
    "3つのチャレンジ完了",
    "完成3个挑战",
  ],
  ["Constância", "Consistency", "Consistência", "Constancia", "継続", "坚持"],
  [
    "4 dias restantes",
    "4 days remaining",
    "4 dias restantes",
    "4 días restantes",
    "残り4日",
    "剩余4天",
  ],
  ["Bloqueado", "Locked", "Bloqueado", "Bloqueado", "ロック中", "已锁定"],
  [
    "Ver todas as conquistas",
    "View all achievements",
    "Ver todas as conquistas",
    "Ver todos los logros",
    "すべての実績を見る",
    "查看全部成就",
  ],
  [
    "CERTIFICADO DE JORNADA",
    "JOURNEY CERTIFICATE",
    "CERTIFICADO DE JORNADA",
    "CERTIFICADO DE VIAJE",
    "旅の証明書",
    "旅程证书",
  ],
  [
    "Domine suas",
    "Master your",
    "Domine as suas",
    "Domina tus",
    "あなたの",
    "掌握你的",
  ],
  ["Milhas", "Miles", "Milhas", "Millas", "マイル", "里程"],
  [
    "Este certificado será desbloqueado ao concluir todos os módulos.",
    "This certificate unlocks when you complete all modules.",
    "Este certificado será desbloqueado ao concluir todos os módulos.",
    "Este certificado se desbloqueará al completar todos los módulos.",
    "すべてのモジュールを完了すると証明書が解放されます。",
    "完成所有模块后即可解锁证书。",
  ],
  [
    "Como desbloquear",
    "How to unlock",
    "Como desbloquear",
    "Cómo desbloquear",
    "解除方法",
    "如何解锁",
  ],
  [
    "PERFIL DO ALUNO",
    "STUDENT PROFILE",
    "PERFIL DO ALUNO",
    "PERFIL DEL ALUMNO",
    "受講者プロフィール",
    "学员资料",
  ],
  [
    "Membro desde setembro de 2026",
    "Member since September 2026",
    "Membro desde setembro de 2026",
    "Miembro desde septiembre de 2026",
    "2026年9月からのメンバー",
    "自2026年9月加入",
  ],
  ["Nível 3", "Level 3", "Nível 3", "Nivel 3", "レベル3", "等级3"],
  [
    "Editar perfil",
    "Edit profile",
    "Editar perfil",
    "Editar perfil",
    "プロフィールを編集",
    "编辑资料",
  ],
  [
    "Dados pessoais",
    "Personal details",
    "Dados pessoais",
    "Datos personales",
    "個人情報",
    "个人信息",
  ],
  [
    "Preferências",
    "Preferences",
    "Preferências",
    "Preferencias",
    "設定",
    "偏好设置",
  ],
  [
    "Notificações",
    "Notifications",
    "Notificações",
    "Notificaciones",
    "通知",
    "通知",
  ],
  ["Segurança", "Security", "Segurança", "Seguridad", "セキュリティ", "安全"],
  ["CONFIGURAÇÕES", "SETTINGS", "DEFINIÇÕES", "CONFIGURACIÓN", "設定", "设置"],
  [
    "Essas informações aparecem apenas no seu perfil.",
    "This information only appears on your profile.",
    "Estas informações aparecem apenas no seu perfil.",
    "Esta información solo aparece en tu perfil.",
    "この情報はプロフィールにのみ表示されます。",
    "这些信息仅显示在你的资料中。",
  ],
  [
    "Nome completo",
    "Full name",
    "Nome completo",
    "Nombre completo",
    "氏名",
    "姓名",
  ],
  ["País", "Country", "País", "País", "国", "国家"],
  ["Brasil", "Brazil", "Brasil", "Brasil", "ブラジル", "巴西"],
  ["Portugal", "Portugal", "Portugal", "Portugal", "ポルトガル", "葡萄牙"],
  [
    "Estados Unidos",
    "United States",
    "Estados Unidos",
    "Estados Unidos",
    "アメリカ合衆国",
    "美国",
  ],
  ["Japão", "Japan", "Japão", "Japón", "日本", "日本"],
  [
    "Programa favorito",
    "Favorite program",
    "Programa favorito",
    "Programa favorito",
    "お気に入りのプログラム",
    "最喜欢的计划",
  ],
  [
    "Salvar alterações",
    "Save changes",
    "Guardar alterações",
    "Guardar cambios",
    "変更を保存",
    "保存更改",
  ],
  [
    "INTERNACIONAL",
    "INTERNATIONAL",
    "INTERNACIONAL",
    "INTERNACIONAL",
    "インターナショナル",
    "国际化",
  ],
  [
    "O conteúdo da plataforma se adapta ao idioma que você escolher.",
    "The platform content adapts to the language you choose.",
    "O conteúdo da plataforma adapta-se ao idioma que escolher.",
    "El contenido de la plataforma se adapta al idioma que elijas.",
    "プラットフォームの内容は選択した言語に適応します。",
    "平台内容会适配你选择的语言。",
  ],
  [
    "Sua escolha é salva automaticamente.",
    "Your choice is saved automatically.",
    "A sua escolha é guardada automaticamente.",
    "Tu elección se guarda automáticamente.",
    "選択は自動的に保存されます。",
    "你的选择会自动保存。",
  ],
  [
    "JORNADA PRONTA PARA DECOLAR",
    "JOURNEY READY FOR TAKEOFF",
    "JORNADA PRONTA PARA DESCOLAR",
    "VIAJE LISTO PARA DESPEGAR",
    "旅立つ準備ができました",
    "旅程准备起飞",
  ],
  [
    "O próximo destino começa com o próximo",
    "The next destination starts with the next",
    "O próximo destino começa com o próximo",
    "El próximo destino comienza con el próximo",
    "次の目的地は次の",
    "下一个目的地始于下一个",
  ],
  ["passo.", "step.", "passo.", "paso.", "一歩。", "步骤。"],
  [
    "Esta é a experiência Domine suas Milhas: uma plataforma para transformar pontos, clareza e confiança em mais viagens.",
    "This is the Domine suas Milhas experience: a platform that turns points, clarity and confidence into more trips.",
    "Esta é a experiência Domine as suas Milhas: uma plataforma para transformar pontos, clareza e confiança em mais viagens.",
    "Esta es la experiencia Domine sus Millas: una plataforma para convertir puntos, claridad y confianza en más viajes.",
    "これがDomine suas Milhasの体験です。ポイント、明確さ、自信をより多くの旅へ変えるプラットフォーム。",
    "这就是 Domine suas Milhas 体验：把积分、清晰和信心转化为更多旅行的平台。",
  ],
  [
    "Voltar ao dashboard",
    "Back to dashboard",
    "Voltar ao painel",
    "Volver al panel",
    "ダッシュボードに戻る",
    "返回仪表板",
  ],
  [
    "Voltar ao início",
    "Review presentation",
    "Voltar ao início",
    "Revisar presentación",
    "プレゼンテーションを見直す",
    "重新查看演示",
  ],
  [
    "Equipe Domine suas Milhas",
    "Domine suas Milhas team",
    "Equipa Domine as suas Milhas",
    "Equipo Domine sus Millas",
    "Domine suas Milhasチーム",
    "Domine suas Milhas 团队",
  ],
  [
    "Domine suas Milhas • 2026",
    "Prototype • September 2026",
    "Protótipo • Setembro de 2026",
    "Prototipo • Septiembre de 2026",
    "プロトタイプ • 2026年9月",
    "原型 • 2026年9月",
  ],
  [
    "CERTIFICADO DE CONCLUSÃO",
    "COMPLETION CERTIFICATE",
    "CERTIFICADO DE CONCLUSÃO",
    "CERTIFICADO DE FINALIZACIÓN",
    "修了証明書",
    "完成证书",
  ],
  ["Você está", "You are", "Está", "Estás", "あなたは", "你已"],
  [
    "pronto para decolar.",
    "ready for takeoff.",
    "pronto para descolar.",
    "listo para despegar.",
    "飛び立つ準備ができています。",
    "准备起飞。",
  ],
  [
    "Uma jornada de aprendizado criada para quem quer viajar mais, pagando menos.",
    "A learning journey created for people who want to travel more while paying less.",
    "Uma jornada de aprendizagem criada para quem quer viajar mais, pagando menos.",
    "Un viaje de aprendizaje creado para quienes quieren viajar más pagando menos.",
    "もっと旅をしたい人のための、少ない支出で学べる旅。",
    "为想花更少、旅行更多的人打造的学习旅程。",
  ],
  [
    "para visualizar a experiência completa",
    "to view the complete experience",
    "para visualizar a experiência completa",
    "para ver la experiencia completa",
    "完全な体験を見るための",
    "查看完整体验",
  ],
  [
    "Livelo selecionado para comparação",
    "Livelo selected for comparison",
    "Livelo selecionado para comparação",
    "Livelo seleccionado para comparación",
    "比較対象にLiveloを選択しました",
    "已选择 Livelo 进行比较",
  ],
  [
    "Smiles selecionado para comparação",
    "Smiles selected for comparison",
    "Smiles selecionado para comparação",
    "Smiles seleccionado para comparación",
    "比較対象にSmilesを選択しました",
    "已选择 Smiles 进行比较",
  ],
  [
    "TudoAzul selecionado para comparação",
    "TudoAzul selected for comparison",
    "TudoAzul selecionado para comparação",
    "TudoAzul seleccionado para comparación",
    "比較対象にTudoAzulを選択しました",
    "已选择 TudoAzul 进行比较",
  ],
  [
    "Acesso demonstrativo liberado",
    "Demo access unlocked",
    "Acesso demonstrativo desbloqueado",
    "Acceso demo desbloqueado",
    "デモアクセスが解除されました",
    "演示访问已解锁",
  ],
  [
    "Link de recuperação enviado para seu e-mail",
    "Recovery link sent to your email",
    "Ligação de recuperação enviada para o seu e-mail",
    "Enlace de recuperación enviado a tu correo",
    "復旧リンクをメールに送信しました",
    "恢复链接已发送到你的邮箱",
  ],
  [
    "Projeção recalculada",
    "Projection recalculated",
    "Projeção recalculada",
    "Proyección recalculada",
    "予測を再計算しました",
    "预测已重新计算",
  ],
  [
    "Aula marcada como concluída",
    "Lesson marked as complete",
    "Aula marcada como concluída",
    "Clase marcada como completada",
    "レッスンを完了として記録しました",
    "课程已标记为完成",
  ],
  [
    "Projeto salvo como rascunho",
    "Project saved as draft",
    "Projeto guardado como rascunho",
    "Proyecto guardado como borrador",
    "プロジェクトを下書き保存しました",
    "项目已保存为草稿",
  ],
  [
    "Preferências atualizadas",
    "Preferences updated",
    "Preferências atualizadas",
    "Preferencias actualizadas",
    "設定を更新しました",
    "偏好设置已更新",
  ],
  [
    "O certificado será liberado ao concluir o curso",
    "The certificate unlocks when you complete the course",
    "O certificado será desbloqueado ao concluir o curso",
    "El certificado se desbloqueará al completar el curso",
    "コース完了時に証明書が解放されます",
    "完成课程后即可解锁证书",
  ],
  [
    "Você não tem novas notificações",
    "You have no new notifications",
    "Não tem novas notificações",
    "No tienes nuevas notificaciones",
    "新しい通知はありません",
    "没有新通知",
  ],
  [
    "PRONTO PARA COMEÇAR?",
    "READY TO BEGIN?",
    "PRONTO PARA COMEÇAR?",
    "¿LISTO PARA EMPEZAR?",
    "始める準備はできましたか？",
    "准备好开始了吗？",
  ],
  [
    "Transforme o próximo destino em um plano possível.",
    "Turn your next destination into an achievable plan.",
    "Transforme o próximo destino num plano possível.",
    "Convierte tu próximo destino en un plan posible.",
    "次の目的地を実現できる計画に変えましょう。",
    "把下一个目的地变成可实现的计划。",
  ],
  [
    "Pagamento seguro, acesso liberado após a confirmação e criação da sua conta.",
    "Secure payment, access released after confirmation and account creation.",
    "Pagamento seguro, acesso libertado após a confirmação e criação da sua conta.",
    "Pago seguro, acceso liberado después de la confirmación y de crear tu cuenta.",
    "安全な支払い、確認後にアカウントを作成するとアクセスが解放されます。",
    "安全付款，确认并创建账户后即可解锁访问权限。",
  ],
  [
    "Quero começar agora",
    "I want to start now",
    "Quero começar agora",
    "Quiero empezar ahora",
    "今すぐ始めたい",
    "我想现在开始",
  ],
];

visualTranslationRows.push(
  [
    "Seu acesso está pronto",
    "Your access is ready",
    "O seu acesso está pronto",
    "Tu acceso está listo",
    "アクセスの準備ができました",
    "你的访问权限已准备就绪",
  ],
  [
    "Crie seu acesso ao curso",
    "Create your course access",
    "Crie o seu acesso ao curso",
    "Crea tu acceso al curso",
    "コースへのアクセスを作成",
    "创建你的课程访问权限",
  ],
  [
    "Entre com o mesmo e-mail usado na compra.",
    "Sign in with the same email used for your purchase.",
    "Entre com o mesmo e-mail usado na compra.",
    "Inicia sesión con el mismo correo usado en la compra.",
    "購入時に使用したメールアドレスでログインしてください。",
    "请使用购买时的同一电子邮件登录。",
  ],
  [
    "Use o mesmo e-mail informado no checkout da Kiwify.",
    "Use the same email entered at Kiwify checkout.",
    "Use o mesmo e-mail indicado no checkout da Kiwify.",
    "Usa el mismo correo indicado en el checkout de Kiwify.",
    "Kiwifyのチェックアウトで入力した同じメールアドレスを使用してください。",
    "请使用在 Kiwify 结账时填写的同一电子邮件。",
  ],
  [
    "O acesso só é liberado quando a compra de R$ 50,00 for confirmada.",
    "Access is released only after the R$50.00 purchase is confirmed.",
    "O acesso só é libertado quando a compra de 50,00 R$ for confirmada.",
    "El acceso se libera solo cuando se confirme la compra de R$50,00.",
    "R$50.00の購入が確認された後にのみアクセスが解放されます。",
    "仅在 R$50.00 的购买确认后才会开放访问权限。",
  ],
  [
    "Crie uma senha segura",
    "Create a secure password",
    "Crie uma palavra-passe segura",
    "Crea una contraseña segura",
    "安全なパスワードを作成",
    "创建安全密码",
  ],
  [
    "Verificando…",
    "Verifying…",
    "A verificar…",
    "Verificando…",
    "確認中…",
    "正在验证…",
  ],
  [
    "SUA JORNADA",
    "YOUR JOURNEY",
    "A SUA JORNADA",
    "TU VIAJE",
    "あなたの旅",
    "你的旅程",
  ],
  [
    "Compra confirmada.",
    "Purchase confirmed.",
    "Compra confirmada.",
    "Compra confirmada.",
    "購入が確認されました。",
    "购买已确认。",
  ],
  [
    "Curso liberado.",
    "Course unlocked.",
    "Curso desbloqueado.",
    "Curso desbloqueado.",
    "コースが解放されました。",
    "课程已解锁。",
  ],
  [
    "Você conclui o pagamento protegido pela Kiwify.",
    "You complete the protected payment through Kiwify.",
    "Conclui o pagamento protegido pela Kiwify.",
    "Completas el pago protegido por Kiwify.",
    "Kiwifyを通じて保護された支払いを完了します。",
    "你通过 Kiwify 完成受保护的付款。",
  ],
  [
    "Confirmamos a compra diretamente com o evento seguro da plataforma.",
    "We confirm the purchase directly through the platform's secure event.",
    "Confirmamos a compra diretamente pelo evento seguro da plataforma.",
    "Confirmamos la compra directamente con el evento seguro de la plataforma.",
    "プラットフォームの安全なイベントを通じて購入を直接確認します。",
    "我们通过平台的安全事件直接确认购买。",
  ],
  [
    "Seu painel, aulas, ferramentas, missões e perfil são liberados.",
    "Your dashboard, lessons, tools, missions and profile are unlocked.",
    "O seu painel, aulas, ferramentas, missões e perfil são desbloqueados.",
    "Tu panel, clases, herramientas, misiones y perfil se desbloquean.",
    "ダッシュボード、レッスン、ツール、ミッション、プロフィールが解放されます。",
    "你的面板、课程、工具、任务和个人资料将被解锁。",
  ],
  [
    "Nenhum acesso é liberado apenas por um link de redirecionamento.",
    "No access is granted by a redirect link alone.",
    "Nenhum acesso é concedido apenas por uma ligação de redirecionamento.",
    "Ningún acceso se concede solo mediante un enlace de redirección.",
    "リダイレクトリンクだけでアクセスが許可されることはありません。",
    "不会仅通过重定向链接授予访问权限。",
  ],
  ["APRENDER", "LEARN", "APRENDER", "APRENDER", "学ぶ", "学习"],
  ["PRATICAR", "PRACTICE", "PRATICAR", "PRACTICAR", "実践する", "实践"],
  ["SIMULAR", "SIMULATE", "SIMULAR", "SIMULAR", "シミュレーション", "模拟"],
  ["EVOLUIR", "GROW", "EVOLUIR", "EVOLUCIONAR", "成長する", "成长"],
  [
    "Conteúdo em vídeo e texto",
    "Video and text content",
    "Conteúdo em vídeo e texto",
    "Contenido en vídeo y texto",
    "動画とテキストのコンテンツ",
    "视频和文字内容",
  ],
  [
    "Exercícios e quizzes",
    "Exercises and quizzes",
    "Exercícios e quizzes",
    "Ejercicios y cuestionarios",
    "演習とクイズ",
    "练习和测验",
  ],
  [
    "Calcule o valor real",
    "Calculate the real value",
    "Calcule o valor real",
    "Calcula el valor real",
    "本当の価値を計算",
    "计算实际价值",
  ],
  [
    "Ganhe XP e conquiste",
    "Earn XP and achieve",
    "Ganhe XP e conquiste",
    "Gana XP y consigue logros",
    "XPを獲得して達成",
    "获得 XP 并取得成就",
  ],
  [
    "Bem-vindo de volta",
    "Welcome back",
    "Bem-vindo de volta",
    "Bienvenido de nuevo",
    "おかえりなさい",
    "欢迎回来",
  ],
  [
    "Continue de onde você parou.",
    "Continue where you left off.",
    "Continue de onde ficou.",
    "Continúa donde lo dejaste.",
    "前回の続きから再開しましょう。",
    "从上次停下的地方继续。",
  ],
  [
    "Comece sua jornada",
    "Start your journey",
    "Comece a sua jornada",
    "Comienza tu viaje",
    "旅を始めましょう",
    "开始你的旅程",
  ],
  [
    "Crie seu cadastro gratuito em poucos minutos.",
    "Create your free account in minutes.",
    "Crie o seu registo gratuito em poucos minutos.",
    "Crea tu cuenta gratuita en pocos minutos.",
    "数分で無料アカウントを作成できます。",
    "几分钟内创建免费账户。",
  ],
  [
    "Entrar na plataforma",
    "Sign in to the platform",
    "Entrar na plataforma",
    "Iniciar sesión en la plataforma",
    "プラットフォームにログイン",
    "登录平台",
  ],
  [
    "Criar minha conta",
    "Create my account",
    "Criar a minha conta",
    "Crear mi cuenta",
    "アカウントを作成",
    "创建我的账户",
  ],
  [
    "DSM / 2026",
    "DSM / 2026",
    "DSM / 2026",
    "DSM / 2026",
    "DSM / 2026",
    "DSM / 2026",
  ],
  [
    "João Silva",
    "João Silva",
    "João Silva",
    "João Silva",
    "João Silva",
    "João Silva",
  ],
  [
    "Fundamentos das milhas",
    "Miles fundamentals",
    "Fundamentos das milhas",
    "Fundamentos de las millas",
    "マイルの基礎",
    "里程基础",
  ],
  [
    "Cartões que pontuam",
    "Rewarding cards",
    "Cartões que pontuam",
    "Tarjetas que generan puntos",
    "ポイントが貯まるカード",
    "积分信用卡",
  ],
  [
    "Acúmulo inteligente",
    "Smart earning",
    "Acumulação inteligente",
    "Acumulación inteligente",
    "スマートな獲得",
    "智能累积",
  ],
  [
    "Transferências bonificadas",
    "Bonus transfers",
    "Transferências bonificadas",
    "Transferencias bonificadas",
    "ボーナス移行",
    "奖励转移",
  ],
  [
    "Resgates e disponibilidade",
    "Redemptions and availability",
    "Resgates e disponibilidade",
    "Canjes y disponibilidad",
    "交換と空席",
    "兑换和可用性",
  ],
  [
    "4 aulas • 48 min",
    "4 lessons • 48 min",
    "4 aulas • 48 min",
    "4 clases • 48 min",
    "4レッスン • 48分",
    "4课 • 48分钟",
  ],
  [
    "5 aulas • 1h 15min",
    "5 lessons • 1h 15min",
    "5 aulas • 1h 15min",
    "5 clases • 1h 15min",
    "5レッスン • 1時間15分",
    "5课 • 1小时15分钟",
  ],
  [
    "6 aulas • 1h 32min",
    "6 lessons • 1h 32min",
    "6 aulas • 1h 32min",
    "6 clases • 1h 32min",
    "6レッスン • 1時間32分",
    "6课 • 1小时32分钟",
  ],
  [
    "4 aulas • 56 min",
    "4 lessons • 56 min",
    "4 aulas • 56 min",
    "4 clases • 56 min",
    "4レッスン • 56分",
    "4课 • 56分钟",
  ],
  [
    "3 aulas • 42 min",
    "3 lessons • 42 min",
    "3 aulas • 42 min",
    "3 clases • 42 min",
    "3レッスン • 42分",
    "3课 • 42分钟",
  ],
  [
    "5 aulas • 1h 08min",
    "5 lessons • 1h 08min",
    "5 aulas • 1h 08min",
    "5 clases • 1h 08min",
    "5レッスン • 1時間08分",
    "5课 • 1小时08分钟",
  ],
  ["Alta", "High", "Alta", "Alta", "高", "高"],
  ["Muito alta", "Very high", "Muito alta", "Muy alta", "非常に高い", "很高"],
  ["Flexíveis", "Flexible", "Flexíveis", "Flexibles", "柔軟", "灵活"],
  [
    "Mais completo",
    "Most complete",
    "Mais completo",
    "Más completo",
    "最も充実",
    "最全面",
  ],
  [
    "Melhor para voar",
    "Best for flying",
    "Melhor para voar",
    "Mejor para volar",
    "フライトに最適",
    "最适合飞行",
  ],
  [
    "Boa alternativa",
    "Good alternative",
    "Boa alternativa",
    "Buena alternativa",
    "良い選択肢",
    "不错的选择",
  ],
  [
    "Banco + parceiros",
    "Bank + partners",
    "Banco + parceiros",
    "Banco + socios",
    "銀行＋パートナー",
    "银行＋合作伙伴",
  ],
  [
    "GOL Linhas Aéreas",
    "GOL Airlines",
    "GOL Linhas Aéreas",
    "GOL Aerolíneas",
    "GOL航空",
    "GOL 航空",
  ],
  [
    "Azul Linhas Aéreas",
    "Azul Airlines",
    "Azul Linhas Aéreas",
    "Azul Aerolíneas",
    "Azul航空",
    "Azul 航空",
  ],
  [
    "Conteúdo em vídeo e texto",
    "Video and text content",
    "Conteúdo em vídeo e texto",
    "Contenido en vídeo y texto",
    "動画とテキストのコンテンツ",
    "视频和文字内容",
  ],
  ["Clubes", "Clubs", "Clubes", "Clubes", "クラブ", "俱乐部"],
  ["Resgates", "Redemptions", "Resgates", "Canjes", "交換", "兑换"],
  ["15 telas", "15 screens", "15 ecrãs", "15 pantallas", "15画面", "15个页面"],
  [
    "Abrir menu",
    "Open menu",
    "Abrir menu",
    "Abrir menú",
    "メニューを開く",
    "打开菜单",
  ],
  [
    "Navegação principal",
    "Main navigation",
    "Navegação principal",
    "Navegación principal",
    "メインナビゲーション",
    "主导航",
  ],
  [
    "MATERIAIS DE EXEMPLO",
    "EXAMPLE MATERIALS",
    "MATERIAIS DE EXEMPLO",
    "MATERIALES DE EJEMPLO",
    "サンプル資料",
    "示例资料",
  ],
  [
    "Documentos de viagem",
    "Travel documents",
    "Documentos de viagem",
    "Documentos de viaje",
    "旅行書類",
    "旅行文件",
  ],
  [
    "Exemplos reais de emissões, roteiros e vouchers para explorar durante a aula.",
    "Real examples of tickets, itineraries and vouchers to explore during the lesson.",
    "Exemplos reais de emissões, itinerários e vouchers para explorar durante a aula.",
    "Ejemplos reales de emisiones, itinerarios y vouchers para explorar durante la clase.",
    "レッスンで確認できる発券、旅程、バウチャーの実例です。",
    "课程中可探索的真实出票、行程和凭证示例。",
  ],
  [
    "Documento anterior",
    "Previous document",
    "Documento anterior",
    "Documento anterior",
    "前の書類",
    "上一个文件",
  ],
  [
    "Próximo documento",
    "Next document",
    "Próximo documento",
    "Siguiente documento",
    "次の書類",
    "下一个文件",
  ],
  ["Ir para", "Go to", "Ir para", "Ir a", "移動先", "前往"],
  [
    "Paginação do carrossel",
    "Carousel pagination",
    "Paginação do carrossel",
    "Paginación del carrusel",
    "カルーセルのページネーション",
    "轮播分页",
  ],
  [
    "ARQUIVO: A DEFINIR",
    "FILE: TO BE DEFINED",
    "FICHEIRO: A DEFINIR",
    "ARCHIVO: POR DEFINIR",
    "ファイル：未定",
    "文件：待定",
  ],
  [
    "PDFs e arquivos finais:",
    "PDFs and final files:",
    "PDFs e ficheiros finais:",
    "PDF y archivos finales:",
    "PDFと最終ファイル：",
    "PDF和最终文件：",
  ],
  ["a definir", "to be defined", "a definir", "por definir", "未定", "待定"],
  [
    "Arquivo a definir",
    "File to be defined",
    "Ficheiro a definir",
    "Archivo por definir",
    "ファイル未定",
    "文件待定",
  ],
  ["Confirmar", "Confirm", "Confirmar", "Confirmar", "確認", "确认"],
  [
    "DOCUMENTO DE VIAGEM",
    "TRAVEL DOCUMENT",
    "DOCUMENTO DE VIAGEM",
    "DOCUMENTO DE VIAJE",
    "旅行書類",
    "旅行文件",
  ],
  ["#Ásia", "#Asia", "#Ásia", "#Asia", "#アジア", "#亚洲"],
  ["#América", "#Americas", "#América", "#América", "#アメリカ", "#美洲"],
  ["#Europa", "#Europe", "#Europa", "#Europa", "#ヨーロッパ", "#欧洲"],
  ["CHINA", "CHINA", "CHINA", "CHINA", "中国", "中国"],
  [
    "ESTADOS UNIDOS",
    "UNITED STATES",
    "ESTADOS UNIDOS",
    "ESTADOS UNIDOS",
    "アメリカ合衆国",
    "美国",
  ],
  ["PORTUGAL", "PORTUGAL", "PORTUGAL", "PORTUGAL", "ポルトガル", "葡萄牙"],
  ["ESPANHA", "SPAIN", "ESPANHA", "ESPAÑA", "スペイン", "西班牙"],
  ["FRANÇA", "FRANCE", "FRANÇA", "FRANCIA", "フランス", "法国"],
  [
    "PASSAGEM AÉREA",
    "FLIGHT TICKET",
    "PASSAGEM AÉREA",
    "BILLETE DE AVIÓN",
    "航空券",
    "机票",
  ],
  [
    "ROTEIRO DE VIAGEM",
    "TRAVEL ITINERARY",
    "ITINERÁRIO DE VIAGEM",
    "ITINERARIO DE VIAJE",
    "旅行日程",
    "旅行行程",
  ],
  [
    "VOUCHER DE HOSPEDAGEM",
    "ACCOMMODATION VOUCHER",
    "VOUCHER DE ALOJAMENTO",
    "VALE DE ALOJAMIENTO",
    "宿泊バウチャー",
    "住宿凭证",
  ],
  [
    "CHECKLIST DE EMISSÃO",
    "ISSUANCE CHECKLIST",
    "CHECKLIST DE EMISSÃO",
    "LISTA DE EMISIÓN",
    "発券チェックリスト",
    "出票清单",
  ],
  [
    "Xangai e Pequim, 10 dias",
    "Shanghai and Beijing, 10 days",
    "Xangai e Pequim, 10 dias",
    "Shanghái y Pekín, 10 días",
    "上海と北京、10日間",
    "上海和北京，10天",
  ],
  [
    "Nova York, 7 dias",
    "New York, 7 days",
    "Nova Iorque, 7 dias",
    "Nueva York, 7 días",
    "ニューヨーク、7日間",
    "纽约，7天",
  ],
  [
    "Lisboa e Porto, 9 dias",
    "Lisbon and Porto, 9 days",
    "Lisboa e Porto, 9 dias",
    "Lisboa y Oporto, 9 días",
    "リスボンとポルト、9日間",
    "里斯本和波尔图，9天",
  ],
  [
    "Madri e Barcelona, 8 dias",
    "Madrid and Barcelona, 8 days",
    "Madrid e Barcelona, 8 dias",
    "Madrid y Barcelona, 8 días",
    "マドリードとバルセロナ、8日間",
    "马德里和巴塞罗那，8天",
  ],
  [
    "Paris, 6 dias",
    "Paris, 6 days",
    "Paris, 6 dias",
    "París, 6 días",
    "パリ、6日間",
    "巴黎，6天",
  ],
  [
    "Navegação principal",
    "Main navigation",
    "Navegação principal",
    "Navegación principal",
    "メインナビゲーション",
    "主导航",
  ],
  [
    "CONTEÚDO DO MÓDULO",
    "MODULE CONTENT",
    "CONTEÚDO DO MÓDULO",
    "CONTENIDO DEL MÓDULO",
    "モジュール内容",
    "模块内容",
  ],
  [
    "OBJETIVOS DESTA AULA",
    "LESSON OBJECTIVES",
    "OBJETIVOS DESTA AULA",
    "OBJETIVOS DE ESTA CLASE",
    "このレッスンの目標",
    "本课目标",
  ],
  [
    "Identificar as diferenças entre os principais programas.",
    "Identify the differences between the main programs.",
    "Identificar as diferenças entre os principais programas.",
    "Identificar las diferencias entre los principales programas.",
    "主要プログラムの違いを見分ける。",
    "识别主要计划之间的差异。",
  ],
  [
    "Escolher um programa de acordo com a sua rota.",
    "Choose a program according to your route.",
    "Escolher um programa de acordo com a sua rota.",
    "Elegir un programa según tu ruta.",
    "ルートに合うプログラムを選ぶ。",
    "根据你的路线选择计划。",
  ],
  [
    "Reconhecer o melhor momento para transferir pontos.",
    "Recognize the best time to transfer points.",
    "Reconhecer o melhor momento para transferir pontos.",
    "Reconocer el mejor momento para transferir puntos.",
    "ポイント移行の最適なタイミングを知る。",
    "识别转移积分的最佳时机。",
  ],
  [
    "MODELO PEDAGÓGICO",
    "PEDAGOGICAL MODEL",
    "MODELO PEDAGÓGICO",
    "MODELO PEDAGÓGICO",
    "教育モデル",
    "教学模型",
  ],
  [
    "Uma aula em oito movimentos.",
    "One lesson in eight movements.",
    "Uma aula em oito movimentos.",
    "Una clase en ocho movimientos.",
    "8つのステップで進むレッスン。",
    "八步完成一课。",
  ],
  [
    "Aprender · aplicar · testar",
    "Learn · apply · test",
    "Aprender · aplicar · testar",
    "Aprender · aplicar · probar",
    "学ぶ · 実践 · テスト",
    "学习 · 应用 · 测试",
  ],
  [
    "O que você vai aprender",
    "What you will learn",
    "O que vai aprender",
    "Lo que aprenderás",
    "学ぶこと",
    "你将学到什么",
  ],
  ["Entenda", "Understand", "Compreenda", "Entiende", "理解する", "理解"],
  ["Exemplo", "Example", "Exemplo", "Ejemplo", "例", "示例"],
  [
    "Como fazer",
    "How to do it",
    "Como fazer",
    "Cómo hacerlo",
    "やり方",
    "如何操作",
  ],
  ["Teste", "Test", "Teste", "Pratique", "テスト", "测试"],
  ["Resultado", "Result", "Resultado", "Resultado", "結果", "结果"],
  ["Resumo", "Summary", "Resumo", "Resumen", "まとめ", "总结"],
  [
    "Próximo passo",
    "Next step",
    "Próximo passo",
    "Siguiente paso",
    "次のステップ",
    "下一步",
  ],
  ["Voltar", "Back", "Voltar", "Volver", "戻る", "返回"],
  [
    "Progresso salvo automaticamente",
    "Progress saved automatically",
    "Progresso guardado automaticamente",
    "Progreso guardado automáticamente",
    "進捗は自動保存されます",
    "进度已自动保存",
  ],
  [
    "Próxima aula",
    "Next lesson",
    "Próxima aula",
    "Próxima clase",
    "次のレッスン",
    "下一课",
  ],
  [
    "TEMAS E MATERIAIS",
    "TOPICS AND MATERIALS",
    "TEMAS E MATERIAIS",
    "TEMAS Y MATERIALES",
    "テーマと資料",
    "主题和资料",
  ],
  [
    "Teste seu conhecimento",
    "Test your knowledge",
    "Teste os seus conhecimentos",
    "Pon a prueba tus conocimientos",
    "知識をテスト",
    "测试你的知识",
  ],
  [
    "Exercício e quiz do módulo",
    "Module exercise and quiz",
    "Exercício e quiz do módulo",
    "Ejercicio y cuestionario del módulo",
    "モジュール演習とクイズ",
    "模块练习和测验",
  ],
  [
    "Desafio aplicado",
    "Applied challenge",
    "Desafio aplicado",
    "Desafío aplicado",
    "実践チャレンジ",
    "实践挑战",
  ],
  [
    "Material complementar · Arquivos a definir",
    "Supplementary material · Files to be defined",
    "Material complementar · Ficheiros a definir",
    "Material complementario · Archivos por definir",
    "補足資料 · ファイル未定",
    "补充材料 · 文件待定",
  ],
  [
    "O que você vai aprender",
    "What you will learn",
    "O que vai aprender",
    "Lo que aprenderás",
    "学ぶこと",
    "你将学到什么",
  ],
  [
    "Entenda · Exemplo · Como fazer",
    "Understand · Example · How to do it",
    "Compreenda · Exemplo · Como fazer",
    "Entiende · Ejemplo · Cómo hacerlo",
    "理解 · 例 · やり方",
    "理解 · 示例 · 如何操作",
  ],
  [
    "Arquivo a definir",
    "File to be defined",
    "Ficheiro a definir",
    "Archivo por definir",
    "ファイル未定",
    "文件待定",
  ],
  [
    "Domine suas milhas",
    "Master your miles",
    "Domine as suas milhas",
    "Domina tus millas",
    "マイルを使いこなす",
    "掌握你的里程",
  ],
  [
    "Idioma salvo no seu perfil",
    "Language saved to your profile",
    "Idioma guardado no seu perfil",
    "Idioma guardado en tu perfil",
    "プロフィールに言語を保存しました",
    "语言已保存到个人资料",
  ],
  [
    "/ 9 módulos",
    "/ 9 modules",
    "/ 9 módulos",
    "/ 9 módulos",
    "/ 9モジュール",
    "/ 9个模块",
  ],
  [
    "22% concluído",
    "22% complete",
    "22% concluído",
    "22% completado",
    "22%完了",
    "已完成22%",
  ],
  [
    "MÓDULO 02 · AULA 02",
    "MODULE 02 · LESSON 02",
    "MÓDULO 02 · AULA 02",
    "MÓDULO 02 · CLASE 02",
    "モジュール02 · レッスン02",
    "模块02 · 第02课",
  ],
  [
    "Caçador bônus",
    "Bonus hunter",
    "Caçador de bónus",
    "Cazador de bonos",
    "ボーナスハンター",
    "奖励猎人",
  ],
  [
    "Complete ações pequenas e acumule XP para desbloquear novas conquistas.",
    "Complete small actions and earn XP to unlock new achievements.",
    "Complete pequenas ações e acumule XP para desbloquear novas conquistas.",
    "Completa pequeñas acciones y gana XP para desbloquear nuevos logros.",
    "小さな行動を完了してXPを獲得し、新しい実績を解放しましょう。",
    "完成小行动并获得 XP，解锁新的成就。",
  ],
  [
    "Tudo concluído!",
    "All done!",
    "Tudo concluído!",
    "¡Todo completado!",
    "すべて完了！",
    "全部完成！",
  ],
  [
    "2 missões restantes",
    "2 missions remaining",
    "2 missões restantes",
    "2 misiones restantes",
    "残り2ミッション",
    "剩余2个任务",
  ],
  [
    "1 missão restante",
    "1 mission remaining",
    "1 missão restante",
    "1 misión restante",
    "残り1ミッション",
    "剩余1个任务",
  ],
  [
    "3 missões restantes",
    "3 missions remaining",
    "3 missões restantes",
    "3 misiones restantes",
    "残り3ミッション",
    "剩余3个任务",
  ],
  [
    "PRÓXIMA AÇÃO",
    "NEXT ACTION",
    "PRÓXIMA AÇÃO",
    "PRÓXIMA ACCIÓN",
    "次のアクション",
    "下一步行动",
  ],
  [
    "Refazer missão",
    "Redo mission",
    "Refazer missão",
    "Repetir misión",
    "ミッションをもう一度",
    "重做任务",
  ],
  [
    "Começar missão",
    "Start mission",
    "Começar missão",
    "Comenzar misión",
    "ミッションを始める",
    "开始任务",
  ],
  [
    "Use o simulador",
    "Use the simulator",
    "Utilize o simulador",
    "Usa el simulador",
    "シミュレーターを使う",
    "使用模拟器",
  ],
  [
    "Adicione seus programas favoritos",
    "Add your favorite programs",
    "Adicione os seus programas favoritos",
    "Añade tus programas favoritos",
    "お気に入りのプログラムを追加",
    "添加你喜欢的计划",
  ],
  [
    "Fundamentos das milhas",
    "Miles fundamentals",
    "Fundamentos das milhas",
    "Fundamentos de las millas",
    "マイルの基礎",
    "里程基础",
  ],
  [
    "Teste o que você aprendeu",
    "Test what you learned",
    "Teste o que aprendeu",
    "Pon a prueba lo aprendido",
    "学んだことをテスト",
    "测试所学内容",
  ],
  [
    "Crie sua primeira projeção",
    "Create your first projection",
    "Crie a sua primeira projeção",
    "Crea tu primera proyección",
    "最初の予測を作成",
    "创建你的首次预测",
  ],
  [
    "Transferir pontos sempre que tiver saldo",
    "Transfer points whenever you have a balance",
    "Transferir pontos sempre que tiver saldo",
    "Transferir puntos siempre que tengas saldo",
    "残高があればいつでもポイントを移行する",
    "只要有余额就转移积分",
  ],
  [
    "Esperar uma campanha de bônus de transferência",
    "Wait for a transfer bonus campaign",
    "Esperar por uma campanha de bónus de transferência",
    "Esperar una campaña de bonos de transferencia",
    "移行ボーナスキャンペーンを待つ",
    "等待转移奖励活动",
  ],
  [
    "Usar os pontos apenas em compras no cartão",
    "Use points only for card purchases",
    "Usar os pontos apenas em compras com cartão",
    "Usar los puntos solo en compras con tarjeta",
    "ポイントをカード購入だけに使う",
    "只用积分进行信用卡消费",
  ],
  [
    "Escolher o programa com mais anúncios",
    "Choose the program with the most ads",
    "Escolher o programa com mais anúncios",
    "Elegir el programa con más anuncios",
    "広告が最も多いプログラムを選ぶ",
    "选择广告最多的计划",
  ],
  [
    "Muito bem!",
    "Well done!",
    "Muito bem!",
    "¡Muy bien!",
    "よくできました！",
    "做得好！",
  ],
  [
    "Quase lá!",
    "Almost there!",
    "Quase lá!",
    "¡Casi!",
    "もう少し！",
    "快完成了！",
  ],
  [
    "Campanhas de bônus são o momento mais inteligente para transferir.",
    "Bonus campaigns are the smartest time to transfer.",
    "As campanhas de bónus são a altura mais inteligente para transferir.",
    "Las campañas de bonos son el momento más inteligente para transferir.",
    "ボーナスキャンペーンが移行の最適なタイミングです。",
    "奖励活动是转移积分的最佳时机。",
  ],
  [
    "Observe as campanhas de bônus: elas podem multiplicar seus pontos.",
    "Watch for bonus campaigns: they can multiply your points.",
    "Esteja atento às campanhas de bónus: podem multiplicar os seus pontos.",
    "Observa las campañas de bonos: pueden multiplicar tus puntos.",
    "ボーナスキャンペーンに注目すれば、ポイントを増やせます。",
    "关注奖励活动，它们可以放大你的积分。",
  ],
  [
    "Resposta registrada! +40 XP",
    "Answer recorded! +40 XP",
    "Resposta registada! +40 XP",
    "¡Respuesta registrada! +40 XP",
    "回答を記録しました！+40 XP",
    "答案已记录！+40 XP",
  ],
  [
    "Você já viu todas as suas conquistas",
    "You have seen all your achievements",
    "Já viu todas as suas conquistas",
    "Ya has visto todos tus logros",
    "すべての実績を確認しました",
    "你已查看全部成就",
  ],
  ["R$ 8.000", "$8,000", "8 000 €", "8.000 €", "¥800,000", "¥80,000"],
  [
    "42.850 pts",
    "42,850 pts",
    "42 850 pts",
    "42.850 puntos",
    "42,850ポイント",
    "42,850积分",
  ],
  [
    "NÃO ATRIBUÍDO]",
    "NOT ASSIGNED]",
    "NÃO ATRIBUÍDO]",
    "NO ASIGNADO]",
    "未設定]",
    "尚未指定]",
  ],
  [
    "Meus links",
    "My links",
    "As minhas ligações",
    "Mis enlaces",
    "リンク",
    "我的链接",
  ],
  [
    "Recursos selecionados para sua jornada",
    "Selected resources for your journey",
    "Recursos selecionados para a sua jornada",
    "Recursos seleccionados para tu viaje",
    "あなたの旅のために選ばれたリソース",
    "为您的旅程精选的资源",
  ],
  [
    "Conectividade para a sua viagem",
    "Connectivity for your trip",
    "Conectividade para a sua viagem",
    "Conectividad para tu viaje",
    "旅行中の通信サービス",
    "旅行连接服务",
  ],
  [
    "Conheça os planos de chip internacional",
    "Explore international SIM plans",
    "Conheça os planos de chip internacional",
    "Conoce los planes de chip internacional",
    "海外SIMのプランを見る",
    "查看国际 SIM 卡套餐",
  ],
  [
    "Abrir Meu Chip",
    "Open Meu Chip",
    "Abrir Meu Chip",
    "Abrir Meu Chip",
    "Meu Chip を開く",
    "打开 Meu Chip",
  ],
  [
    "Formulário de interesse",
    "Interest form",
    "Formulário de interesse",
    "Formulario de interés",
    "お問い合わせフォーム",
    "意向表单",
  ],
  [
    "Conte-nos como podemos ajudar",
    "Tell us how we can help",
    "Diga-nos como podemos ajudar",
    "Cuéntanos cómo podemos ayudarte",
    "どのようにお手伝いできるか教えてください",
    "告诉我们如何帮助您",
  ],
  [
    "Abrir formulário",
    "Open form",
    "Abrir formulário",
    "Abrir formulario",
    "フォームを開く",
    "打开表单",
  ],
  [
    "MILHAS QUE VIRARAM MEMÓRIAS",
    "MILES THAT BECAME MEMORIES",
    "MILHAS QUE VIRARAM MEMÓRIAS",
    "MILLAS QUE SE CONVIRTIERON EN RECUERDOS",
    "思い出になったマイル",
    "化作回忆的里程",
  ],
  [
    "Milhas que viraram memórias",
    "Miles that became memories",
    "Milhas que viraram memórias",
    "Millas que se convirtieron en recuerdos",
    "思い出になったマイル",
    "化作回忆的里程",
  ],
  [
    "Antes de ensinar a viajar com mais estratégia, ela viveu cada rota. Agora, sua próxima lembrança pode começar aqui.",
    "Before teaching smarter travel, she experienced every route. Now, your next memory can begin here.",
    "Antes de ensinar a viajar com mais estratégia, viveu cada rota. Agora, a sua próxima memória pode começar aqui.",
    "Antes de enseñar a viajar con más estrategia, vivió cada ruta. Ahora, tu próximo recuerdo puede empezar aquí.",
    "より賢く旅する方法を教える前に、彼女は一つひとつのルートを体験しました。次の思い出は、ここから始まるかもしれません。",
    "在教授如何更聪明地旅行之前，她亲身体验过每一条路线。你的下一段回忆，也许就从这里开始。",
  ],
  ["Espanha", "Spain", "Espanha", "España", "スペイン", "西班牙"],
  ["Grécia", "Greece", "Grécia", "Grecia", "ギリシャ", "希腊"],
  [
    "Holanda",
    "Netherlands",
    "Países Baixos",
    "Países Bajos",
    "オランダ",
    "荷兰",
  ],
  ["Itália", "Italy", "Itália", "Italia", "イタリア", "意大利"],
  ["Portugal", "Portugal", "Portugal", "Portugal", "ポルトガル", "葡萄牙"],
  [
    "Reino Unido",
    "United Kingdom",
    "Reino Unido",
    "Reino Unido",
    "イギリス",
    "英国",
  ],
  ["Suíça", "Switzerland", "Suíça", "Suiza", "スイス", "瑞士"],
  ["França", "France", "França", "Francia", "フランス", "法国"],
  [
    "Uma emissão bem planejada abre espaço para o inesperado.",
    "A well-planned redemption makes room for the unexpected.",
    "Uma emissão bem planeada abre espaço para o inesperado.",
    "Un canje bien planificado deja espacio para lo inesperado.",
    "計画的な特典航空券の発券が、予想外の体験の余白をつくります。",
    "精心规划的兑换，为意想不到的体验留出空间。",
  ],
  [
    "Mais que um destino: a liberdade de saber usar seus pontos.",
    "More than a destination: the freedom to know how to use your points.",
    "Mais do que um destino: a liberdade de saber usar os seus pontos.",
    "Más que un destino: la libertad de saber usar tus puntos.",
    "目的地以上のもの。ポイントを使いこなす自由です。",
    "不止一个目的地：更是懂得使用积分的自由。",
  ],
  [
    "Quando o planejamento encontra o mundo.",
    "When planning meets the world.",
    "Quando o planeamento encontra o mundo.",
    "Cuando la planificación se encuentra con el mundo.",
    "計画が世界と出会うとき。",
    "当规划与世界相遇。",
  ],
  [
    "Viajar melhor é transformar escolhas em memórias.",
    "Traveling better is turning choices into memories.",
    "Viajar melhor é transformar escolhas em memórias.",
    "Viajar mejor es convertir decisiones en recuerdos.",
    "より良く旅するとは、選択を思い出に変えること。",
    "更好的旅行，是把选择变成回忆。",
  ],
  [
    "Começar pequeno. Chegar muito mais longe.",
    "Start small. Go much farther.",
    "Começar pequeno. Chegar muito mais longe.",
    "Empieza pequeño. Llega mucho más lejos.",
    "小さく始めて、ずっと遠くへ。",
    "从小开始，走得更远。",
  ],
  [
    "Cada milha pode aproximar você do que parecia distante.",
    "Every mile can bring what seemed distant closer.",
    "Cada milha pode aproximá-lo do que parecia distante.",
    "Cada milla puede acercarte a lo que parecía distante.",
    "一つひとつのマイルが、遠く見えたものを近づけます。",
    "每一里程，都能让看似遥远的事物更近一步。",
  ],
  [
    "O destino muda. A estratégia fica.",
    "Destinations change. Strategy stays.",
    "O destino muda. A estratégia fica.",
    "El destino cambia. La estrategia permanece.",
    "目的地は変わっても、戦略は残ります。",
    "目的地会改变，策略始终不变。",
  ],
  [
    "Paris prova que cada milha pode virar uma memória inesquecível.",
    "Paris proves every mile can become an unforgettable memory.",
    "Paris prova que cada milha pode tornar-se numa memória inesquecível.",
    "París demuestra que cada milla puede convertirse en un recuerdo inolvidable.",
    "パリは、一つひとつのマイルが忘れられない思い出になることを教えてくれます。",
    "巴黎证明，每一里程都能成为难忘的回忆。",
  ],
  [
    "O próximo carimbo pode ser seu",
    "The next stamp can be yours",
    "O próximo carimbo pode ser seu",
    "El próximo sello puede ser tuyo",
    "次のスタンプはあなたのもの",
    "下一枚印章可能属于你",
  ],
  [
    "Aprenda a transformar seus pontos em novas histórias.",
    "Learn to turn your points into new stories.",
    "Aprenda a transformar os seus pontos em novas histórias.",
    "Aprende a convertir tus puntos en nuevas historias.",
    "ポイントを新しい物語に変える方法を学びましょう。",
    "学会把你的积分变成新的故事。",
  ],
  [
    "Ver como funciona",
    "See how it works",
    "Ver como funciona",
    "Ver cómo funciona",
    "仕組みを見る",
    "了解运作方式",
  ],
  [
    "Abrir foto de Espanha em tela cheia",
    "Open Spain photo full screen",
    "Abrir fotografia de Espanha em ecrã inteiro",
    "Abrir foto de España a pantalla completa",
    "スペインの写真を全画面で開く",
    "全屏打开西班牙照片",
  ],
  [
    "Abrir foto de Grécia em tela cheia",
    "Open Greece photo full screen",
    "Abrir fotografia da Grécia em ecrã inteiro",
    "Abrir foto de Grecia a pantalla completa",
    "ギリシャの写真を全画面で開く",
    "全屏打开希腊照片",
  ],
  [
    "Abrir foto de Holanda em tela cheia",
    "Open Netherlands photo full screen",
    "Abrir fotografia dos Países Baixos em ecrã inteiro",
    "Abrir foto de Países Bajos a pantalla completa",
    "オランダの写真を全画面で開く",
    "全屏打开荷兰照片",
  ],
  [
    "Abrir foto de Itália em tela cheia",
    "Open Italy photo full screen",
    "Abrir fotografia de Itália em ecrã inteiro",
    "Abrir foto de Italia a pantalla completa",
    "イタリアの写真を全画面で開く",
    "全屏打开意大利照片",
  ],
  [
    "Abrir foto de Portugal em tela cheia",
    "Open Portugal photo full screen",
    "Abrir fotografia de Portugal em ecrã inteiro",
    "Abrir foto de Portugal a pantalla completa",
    "ポルトガルの写真を全画面で開く",
    "全屏打开葡萄牙照片",
  ],
  [
    "Abrir foto de Reino Unido em tela cheia",
    "Open United Kingdom photo full screen",
    "Abrir fotografia do Reino Unido em ecrã inteiro",
    "Abrir foto de Reino Unido a pantalla completa",
    "イギリスの写真を全画面で開く",
    "全屏打开英国照片",
  ],
  [
    "Abrir foto de Suíça em tela cheia",
    "Open Switzerland photo full screen",
    "Abrir fotografia da Suíça em ecrã inteiro",
    "Abrir foto de Suiza a pantalla completa",
    "スイスの写真を全画面で開く",
    "全屏打开瑞士照片",
  ],
  [
    "Abrir foto de França em tela cheia",
    "Open France photo full screen",
    "Abrir fotografia de França em ecrã inteiro",
    "Abrir foto de Francia a pantalla completa",
    "フランスの写真を全画面で開く",
    "全屏打开法国照片",
  ],
  [
    "Fechar foto",
    "Close photo",
    "Fechar fotografia",
    "Cerrar foto",
    "写真を閉じる",
    "关闭照片",
  ],
  [
    "Foto anterior",
    "Previous photo",
    "Fotografia anterior",
    "Foto anterior",
    "前の写真",
    "上一张照片",
  ],
  [
    "Próxima foto",
    "Next photo",
    "Fotografia seguinte",
    "Foto siguiente",
    "次の写真",
    "下一张照片",
  ],
  [
    "Foto ampliada",
    "Enlarged photo",
    "Fotografia ampliada",
    "Foto ampliada",
    "拡大写真",
    "放大照片",
  ],
  [
    "Viagem pela Espanha",
    "Trip through Spain",
    "Viagem por Espanha",
    "Viaje por España",
    "スペインの旅",
    "西班牙之旅",
  ],
  [
    "Viagem pela Grécia",
    "Trip through Greece",
    "Viagem pela Grécia",
    "Viaje por Grecia",
    "ギリシャの旅",
    "希腊之旅",
  ],
  [
    "Viagem pela Holanda",
    "Trip through the Netherlands",
    "Viagem pelos Países Baixos",
    "Viaje por los Países Bajos",
    "オランダの旅",
    "荷兰之旅",
  ],
  [
    "Viagem pela Itália",
    "Trip through Italy",
    "Viagem por Itália",
    "Viaje por Italia",
    "イタリアの旅",
    "意大利之旅",
  ],
  [
    "Viagem por Portugal",
    "Trip through Portugal",
    "Viagem por Portugal",
    "Viaje por Portugal",
    "ポルトガルの旅",
    "葡萄牙之旅",
  ],
  [
    "Viagem pelo Reino Unido",
    "Trip through the United Kingdom",
    "Viagem pelo Reino Unido",
    "Viaje por Reino Unido",
    "イギリスの旅",
    "英国之旅",
  ],
  [
    "Viagem pela Suíça",
    "Trip through Switzerland",
    "Viagem pela Suíça",
    "Viaje por Suiza",
    "スイスの旅",
    "瑞士之旅",
  ],
  [
    "Viagem pela França",
    "Trip through France",
    "Viagem por França",
    "Viaje por Francia",
    "フランスの旅",
    "法国之旅",
  ],
  [
    "APRESENTAÇÃO EM VÍDEO",
    "VIDEO INTRODUCTION",
    "APRESENTAÇÃO EM VÍDEO",
    "PRESENTACIÓN EN VÍDEO",
    "ビデオ紹介",
    "视频介绍",
  ],
  [
    "Conheça quem transforma milhas em novas rotas",
    "Meet the person who turns miles into new routes",
    "Conheça quem transforma milhas em novas rotas",
    "Conoce a quien transforma millas en nuevas rutas",
    "マイルを新しい旅へ変える人を紹介します",
    "认识把里程变成新路线的人",
  ],
  [
    "Uma conversa para você entender como planejamento, estratégia e escolhas inteligentes podem levar sua próxima viagem mais longe.",
    "A conversation to show how planning, strategy and smart choices can take your next trip further.",
    "Uma conversa para perceber como o planeamento, a estratégia e escolhas inteligentes podem levar a sua próxima viagem mais longe.",
    "Una conversación para entender cómo la planificación, la estrategia y las decisiones inteligentes pueden llevar tu próximo viaje más lejos.",
    "計画、戦略、そして賢い選択が次の旅をもっと遠くへ導く方法をご紹介します。",
    "通过这段分享，了解规划、策略和明智选择如何让你的下一段旅行走得更远。",
  ],
  [
    "Apresentação da Milhas Rotadas",
    "Milhas Rotadas introduction",
    "Apresentação da Milhas Rotadas",
    "Presentación de Milhas Rotadas",
    "Milhas Rotadas の紹介",
    "Milhas Rotadas 介绍",
  ],
  [
    "Perfil personalizado",
    "Personalized profile",
    "Perfil personalizado",
    "Perfil personalizado",
    "カスタマイズされたプロフィール",
    "个性化资料",
  ],
  [
    "Trocar foto",
    "Change photo",
    "Trocar fotografia",
    "Cambiar foto",
    "写真を変更",
    "更换照片",
  ],
  [
    "Enviando…",
    "Uploading…",
    "A enviar…",
    "Subiendo…",
    "アップロード中…",
    "上传中…",
  ],
  [
    "Sair da conta",
    "Sign out",
    "Sair da conta",
    "Cerrar sesión",
    "ログアウト",
    "退出账户",
  ],
  [
    "Saindo da conta…",
    "Signing out…",
    "A sair da conta…",
    "Cerrando sesión…",
    "ログアウト中…",
    "正在退出…",
  ],
  [
    "Isso não apaga sua conta.",
    "This does not delete your account.",
    "Isto não elimina a sua conta.",
    "Esto no elimina tu cuenta.",
    "アカウントは削除されません。",
    "这不会删除你的账户。",
  ],
  [
    "FOTO PRINCIPAL",
    "PRIMARY PHOTO",
    "FOTOGRAFIA PRINCIPAL",
    "FOTO PRINCIPAL",
    "メイン写真",
    "主照片",
  ],
  [
    "Qual foto deve ficar fixa?",
    "Which photo should stay as your primary?",
    "Que fotografia deve ficar fixa?",
    "¿Qué foto debe quedar fija?",
    "どの写真をメインにしますか？",
    "要固定哪张照片？",
  ],
  [
    "Escolha a imagem que aparece no seu perfil ao entrar na plataforma.",
    "Choose the image shown on your profile when you enter the platform.",
    "Escolha a imagem que aparece no seu perfil ao entrar na plataforma.",
    "Elige la imagen que aparece en tu perfil al entrar en la plataforma.",
    "プラットフォームに入ったときにプロフィールに表示する画像を選択してください。",
    "选择进入平台时显示在资料中的图片。",
  ],
  [
    "Foto da conta Google",
    "Google account photo",
    "Fotografia da conta Google",
    "Foto de la cuenta de Google",
    "Googleアカウントの写真",
    "Google账户照片",
  ],
  [
    "Foto enviada ao perfil",
    "Uploaded profile photo",
    "Fotografia enviada para o perfil",
    "Foto subida al perfil",
    "プロフィールにアップロードした写真",
    "上传到资料的照片",
  ],
  [
    "Usar como foto principal",
    "Use as primary photo",
    "Usar como fotografia principal",
    "Usar como foto principal",
    "メイン写真として使用",
    "设为主照片",
  ],
  [
    "Não disponível neste login",
    "Not available for this login",
    "Não disponível neste início de sessão",
    "No disponible en este inicio de sesión",
    "このログインでは利用できません",
    "此登录不可用",
  ],
  [
    "Envie uma foto para usar esta opção",
    "Upload a photo to use this option",
    "Envie uma fotografia para usar esta opção",
    "Sube una foto para usar esta opción",
    "このオプションを使うには写真をアップロードしてください",
    "上传照片以使用此选项",
  ],
  [
    "DADOS PESSOAIS",
    "PERSONAL DETAILS",
    "DADOS PESSOAIS",
    "DATOS PERSONALES",
    "個人情報",
    "个人资料",
  ],
  [
    "Seu perfil",
    "Your profile",
    "O seu perfil",
    "Tu perfil",
    "プロフィール",
    "你的资料",
  ],
  [
    "O e-mail é vinculado ao login e não pode ser editado nesta área.",
    "Your email is linked to your login and cannot be edited here.",
    "O e-mail está associado ao início de sessão e não pode ser editado nesta área.",
    "El correo está vinculado al inicio de sesión y no se puede editar aquí.",
    "メールアドレスはログインに紐づいているため、ここでは編集できません。",
    "邮箱与登录账户关联，无法在此处编辑。",
  ],
  [
    "Nome de usuário",
    "Username",
    "Nome de utilizador",
    "Nombre de usuario",
    "ユーザー名",
    "用户名",
  ],
  [
    "Como quer ser chamado?",
    "What should we call you?",
    "Como quer ser tratado?",
    "¿Cómo quieres que te llamemos?",
    "呼び名を入力してください",
    "请输入您的称呼",
  ],
  [
    "Seu nome completo",
    "Your full name",
    "O seu nome completo",
    "Tu nombre completo",
    "氏名",
    "您的姓名",
  ],
  [
    "E-mail da conta",
    "Account email",
    "E-mail da conta",
    "Correo de la cuenta",
    "アカウントのメールアドレス",
    "账户邮箱",
  ],
  [
    "Programas favoritos",
    "Favorite programs",
    "Programas favoritos",
    "Programas favoritos",
    "お気に入りのプログラム",
    "收藏的计划",
  ],
  [
    "Escolha os programas que você quer acompanhar.",
    "Choose the programs you want to follow.",
    "Escolha os programas que quer acompanhar.",
    "Elige los programas que quieres seguir.",
    "フォローしたいプログラムを選択してください。",
    "选择您想关注的计划。",
  ],
  ["Salvando…", "Saving…", "A guardar…", "Guardando…", "保存中…", "正在保存…"],
  [
    "Criar meu perfil",
    "Create my profile",
    "Criar o meu perfil",
    "Crear mi perfil",
    "プロフィールを作成",
    "创建我的资料",
  ],
  [
    "Escolha o idioma que será usado em toda a plataforma.",
    "Choose the language used throughout the platform.",
    "Escolha o idioma que será usado em toda a plataforma.",
    "Elige el idioma que se usará en toda la plataforma.",
    "プラットフォーム全体で使用する言語を選択してください。",
    "选择整个平台使用的语言。",
  ],
  [
    "Salve o perfil para manter também esta escolha.",
    "Save your profile to keep this choice too.",
    "Guarde o perfil para manter também esta escolha.",
    "Guarda el perfil para conservar también esta elección.",
    "この選択も保持するにはプロフィールを保存してください。",
    "保存资料以保留此选择。",
  ],
);

const visualTranslationIndex: Record<string, Record<Lang, string>> = {};
visualTranslationRows.push(
  ...copyAdditions,
  ...lesson01TranslationRows,
  ...siteAuditTranslationRows,
);
for (const [pt, en, ptPT, es, ja, zh] of visualTranslationRows) {
  const values: Record<Lang, string> = {
    "pt-BR": pt,
    en,
    "pt-PT": ptPT,
    es,
    ja,
    zh,
  };
  for (const value of Object.values(values))
    visualTranslationIndex[value.replace(/\s+/g, " ").trim()] = values;
}

function translateVisibleValue(value: string, language: Lang) {
  const normalized = value.replace(/\s+/g, " ").trim();
  const row = visualTranslationIndex[normalized];
  if (!row) return value;
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  return `${leading}${row[language]}${trailing}`;
}

const translations: Record<
  Lang,
  {
    nav: [string, string, string, string, string];
    language: string;
    profile: string;
    presentation: string;
    next: string;
    back: string;
    slide: string;
    selectLanguage: string;
    saved: string;
    continue: string;
    start: string;
    viewAll: string;
    slides: { title: string; description: string }[];
  }
> = {
  "pt-BR": {
    nav: ["Início", "Curso", "Ferramentas", "Missões", "Perfil"],
    language: "Idioma",
    profile: "Meu perfil",
    presentation: "Protótipo navegável",
    next: "Próximo",
    back: "Voltar",
    slide: "tela",
    selectLanguage: "Escolha seu idioma",
    saved: "Idioma salvo no seu perfil",
    continue: "Continuar",
    start: "Começar jornada",
    viewAll: "Ver tudo",
    slides: [
      {
        title: "Milhas Rotadas — Domine suas Milhas",
        description:
          "Aprenda a acumular, multiplicar e utilizar seus pontos de forma estratégica.",
      },
      {
        title: "Uma jornada que transforma pontos em possibilidades",
        description:
          "Conteúdo, prática e decisões inteligentes em um único lugar.",
      },
      {
        title: "Seu acesso começa aqui",
        description:
          "Entre, crie sua conta e escolha a forma de pagamento mais conveniente.",
      },
      {
        title: "Sua jornada começa agora",
        description: "Um primeiro passo claro, leve e feito para você avançar.",
      },
      {
        title: "Tudo o que importa, em um só painel",
        description:
          "Veja seu progresso, retome a aula e saiba exatamente o próximo passo.",
      },
      {
        title: "O mapa para dominar milhas",
        description:
          "Nove módulos organizados do básico ao avançado, no seu ritmo.",
      },
      {
        title: "Aulas que cabem na sua rotina",
        description:
          "Assista, pratique e registre seus aprendizados sem perder o fio.",
      },
      {
        title: "Simule antes de decidir",
        description:
          "Transforme seus gastos em uma estratégia de pontos mais inteligente.",
      },
      {
        title: "Compare. Escolha. Viaje melhor.",
        description:
          "Encontre o programa que combina com o seu momento e seus objetivos.",
      },
      {
        title: "Pequenas missões, grandes conquistas",
        description:
          "Há sempre uma próxima ação para colocar seu conhecimento em prática.",
      },
      {
        title: "Aprenda jogando",
        description:
          "Teste seus conhecimentos, receba feedback e avance com confiança.",
      },
      {
        title: "Seu projeto de viagem",
        description:
          "Aplique o método completo em um plano real, do objetivo ao resgate.",
      },
      {
        title: "Seu progresso merece ser visto",
        description:
          "Conquistas, evolução e um certificado para celebrar cada etapa.",
      },
      {
        title: "Tudo do seu jeito",
        description:
          "Personalize seu perfil, idioma e preferências em poucos toques.",
      },
      {
        title: "Você está no controle",
        description:
          "Sua próxima viagem começa com uma decisão mais inteligente hoje.",
      },
    ],
  },
  en: {
    nav: ["Home", "Course", "Tools", "Missions", "Profile"],
    language: "Language",
    profile: "My profile",
    presentation: "Clickable prototype",
    next: "Next",
    back: "Back",
    slide: "screen",
    selectLanguage: "Choose your language",
    saved: "Language saved to your profile",
    continue: "Continue",
    start: "Start journey",
    viewAll: "View all",
    slides: [
      {
        title: "Master your miles",
        description:
          "Learn to earn, multiply and use your points strategically.",
      },
      {
        title: "A journey that turns points into possibilities",
        description: "Content, practice and smart decisions in one place.",
      },
      {
        title: "Your access starts here",
        description:
          "Sign in, create your account and choose the best payment method.",
      },
      {
        title: "Your journey starts now",
        description:
          "A clear, light first step designed to help you move forward.",
      },
      {
        title: "Everything that matters, in one dashboard",
        description:
          "See your progress, resume a lesson and know what comes next.",
      },
      {
        title: "The map to mastering miles",
        description:
          "Nine modules organized from beginner to advanced, at your pace.",
      },
      {
        title: "Lessons that fit your routine",
        description:
          "Watch, practice and save your learning without losing the thread.",
      },
      {
        title: "Simulate before you decide",
        description: "Turn your spending into a smarter points strategy.",
      },
      {
        title: "Compare. Choose. Travel better.",
        description: "Find the program that fits your goals and your moment.",
      },
      {
        title: "Small missions, big wins",
        description:
          "There is always one next action to put your knowledge into practice.",
      },
      {
        title: "Learn by playing",
        description:
          "Test your knowledge, get feedback and move forward with confidence.",
      },
      {
        title: "Your travel project",
        description:
          "Apply the full method to a real plan, from goal to redemption.",
      },
      {
        title: "Your progress deserves to be seen",
        description:
          "Achievements, evolution and a certificate to celebrate every step.",
      },
      {
        title: "Make it yours",
        description:
          "Personalize your profile, language and preferences in a few taps.",
      },
      {
        title: "You are in control",
        description: "Your next trip begins with a smarter decision today.",
      },
    ],
  },
  "pt-PT": {
    nav: ["Início", "Curso", "Ferramentas", "Missões", "Perfil"],
    language: "Idioma",
    profile: "O meu perfil",
    presentation: "Protótipo navegável",
    next: "Seguinte",
    back: "Voltar",
    slide: "ecrã",
    selectLanguage: "Escolha o seu idioma",
    saved: "Idioma guardado no seu perfil",
    continue: "Continuar",
    start: "Começar jornada",
    viewAll: "Ver tudo",
    slides: [
      {
        title: "Domine as suas milhas",
        description:
          "Aprenda a acumular, multiplicar e utilizar os seus pontos de forma estratégica.",
      },
      {
        title: "Uma jornada que transforma pontos em possibilidades",
        description: "Conteúdo, prática e decisões inteligentes num só lugar.",
      },
      {
        title: "O seu acesso começa aqui",
        description:
          "Entre, crie a sua conta e escolha o método de pagamento mais conveniente.",
      },
      {
        title: "A sua jornada começa agora",
        description: "Um primeiro passo claro, leve e feito para avançar.",
      },
      {
        title: "Tudo o que importa, num só painel",
        description: "Veja o progresso, retome a aula e saiba o próximo passo.",
      },
      {
        title: "O mapa para dominar milhas",
        description:
          "Nove módulos organizados do básico ao avançado, ao seu ritmo.",
      },
      {
        title: "Aulas que cabem na sua rotina",
        description:
          "Veja, pratique e registe o que aprendeu sem perder o fio.",
      },
      {
        title: "Simule antes de decidir",
        description:
          "Transforme os seus gastos numa estratégia de pontos mais inteligente.",
      },
      {
        title: "Compare. Escolha. Viaje melhor.",
        description:
          "Encontre o programa que combina consigo e com os seus objetivos.",
      },
      {
        title: "Pequenas missões, grandes conquistas",
        description:
          "Existe sempre uma próxima ação para pôr o conhecimento em prática.",
      },
      {
        title: "Aprenda a jogar",
        description:
          "Teste os seus conhecimentos, receba feedback e avance com confiança.",
      },
      {
        title: "O seu projeto de viagem",
        description:
          "Aplique o método completo num plano real, do objetivo ao resgate.",
      },
      {
        title: "O seu progresso merece ser visto",
        description:
          "Conquistas, evolução e um certificado para celebrar cada etapa.",
      },
      {
        title: "Tudo à sua maneira",
        description:
          "Personalize o seu perfil, idioma e preferências em poucos toques.",
      },
      {
        title: "Está no controlo",
        description:
          "A sua próxima viagem começa hoje com uma decisão mais inteligente.",
      },
    ],
  },
  es: {
    nav: ["Inicio", "Curso", "Herramientas", "Misiones", "Perfil"],
    language: "Idioma",
    profile: "Mi perfil",
    presentation: "Prototipo navegable",
    next: "Siguiente",
    back: "Volver",
    slide: "pantalla",
    selectLanguage: "Elige tu idioma",
    saved: "Idioma guardado en tu perfil",
    continue: "Continuar",
    start: "Comenzar viaje",
    viewAll: "Ver todo",
    slides: [
      {
        title: "Domina tus millas",
        description:
          "Aprende a acumular, multiplicar y utilizar tus puntos estratégicamente.",
      },
      {
        title: "Un viaje que transforma puntos en posibilidades",
        description:
          "Contenido, práctica y decisiones inteligentes en un solo lugar.",
      },
      {
        title: "Tu acceso comienza aquí",
        description:
          "Entra, crea tu cuenta y elige el método de pago más conveniente.",
      },
      {
        title: "Tu viaje comienza ahora",
        description: "Un primer paso claro y ligero para ayudarte a avanzar.",
      },
      {
        title: "Todo lo importante, en un solo panel",
        description:
          "Mira tu progreso, retoma la clase y descubre el siguiente paso.",
      },
      {
        title: "El mapa para dominar millas",
        description: "Nueve módulos del nivel básico al avanzado, a tu ritmo.",
      },
      {
        title: "Clases que caben en tu rutina",
        description:
          "Mira, practica y guarda tus aprendizajes sin perder el hilo.",
      },
      {
        title: "Simula antes de decidir",
        description:
          "Convierte tus gastos en una estrategia de puntos más inteligente.",
      },
      {
        title: "Compara. Elige. Viaja mejor.",
        description: "Encuentra el programa que combina con tus objetivos.",
      },
      {
        title: "Pequeñas misiones, grandes logros",
        description:
          "Siempre hay una próxima acción para poner el conocimiento en práctica.",
      },
      {
        title: "Aprende jugando",
        description: "Pon a prueba tus conocimientos y avanza con confianza.",
      },
      {
        title: "Tu proyecto de viaje",
        description:
          "Aplica el método completo en un plan real, del objetivo al canje.",
      },
      {
        title: "Tu progreso merece ser visto",
        description:
          "Logros, evolución y un certificado para celebrar cada etapa.",
      },
      {
        title: "Todo a tu manera",
        description:
          "Personaliza tu perfil, idioma y preferencias en pocos toques.",
      },
      {
        title: "Tú tienes el control",
        description:
          "Tu próximo viaje comienza con una decisión más inteligente hoy.",
      },
    ],
  },
  ja: {
    nav: ["ホーム", "コース", "ツール", "ミッション", "プロフィール"],
    language: "言語",
    profile: "マイプロフィール",
    presentation: "操作できるプロトタイプ",
    next: "次へ",
    back: "戻る",
    slide: "画面",
    selectLanguage: "言語を選択",
    saved: "プロフィールに保存しました",
    continue: "続ける",
    start: "旅を始める",
    viewAll: "すべて見る",
    slides: [
      {
        title: "マイルを使いこなす",
        description: "ポイントを貯め、増やし、戦略的に使う方法を学びます。",
      },
      {
        title: "ポイントを可能性に変える旅",
        description: "学び、練習、賢い選択をひとつの場所で。",
      },
      {
        title: "アクセスはこちらから",
        description: "ログインまたは登録し、便利な支払い方法を選択します。",
      },
      {
        title: "あなたの旅は今始まります",
        description: "次の一歩がわかる、シンプルなスタート。",
      },
      {
        title: "大切な情報をひとつのダッシュボードに",
        description: "進捗と次のレッスンをすぐに確認できます。",
      },
      {
        title: "マイルを極めるマップ",
        description: "初級から上級まで、9つのモジュールを自分のペースで。",
      },
      {
        title: "日常に合うレッスン",
        description: "見て、練習して、学びを記録しましょう。",
      },
      {
        title: "決める前にシミュレーション",
        description: "支出をスマートなポイント戦略に変えます。",
      },
      {
        title: "比較して、選んで、もっと旅を",
        description: "目標に合うプログラムを見つけます。",
      },
      {
        title: "小さなミッション、大きな達成",
        description: "知識を行動に変える次の一歩があります。",
      },
      {
        title: "遊びながら学ぶ",
        description: "知識を試して、自信を持って進みましょう。",
      },
      {
        title: "あなたの旅行プロジェクト",
        description: "目標から特典交換まで、学びを実際の計画に。",
      },
      {
        title: "進捗を見える形に",
        description: "実績と証明書で成長を祝いましょう。",
      },
      {
        title: "あなたらしく",
        description: "プロフィール、言語、設定を簡単にカスタマイズ。",
      },
      {
        title: "主役はあなた",
        description: "次の旅行は、今日の賢い選択から始まります。",
      },
    ],
  },
  zh: {
    nav: ["首页", "课程", "工具", "任务", "个人资料"],
    language: "语言",
    profile: "我的资料",
    presentation: "可操作原型",
    next: "下一步",
    back: "返回",
    slide: "页面",
    selectLanguage: "选择语言",
    saved: "语言已保存到个人资料",
    continue: "继续",
    start: "开始旅程",
    viewAll: "查看全部",
    slides: [
      {
        title: "掌握你的里程",
        description: "学习积累、放大并策略性地使用积分。",
      },
      {
        title: "把积分变成可能性的旅程",
        description: "学习、练习和明智决策汇聚于一处。",
      },
      {
        title: "从这里开始访问",
        description: "登录、创建账户并选择最方便的付款方式。",
      },
      {
        title: "你的旅程现在开始",
        description: "清晰、轻松的第一步，助你不断前进。",
      },
      {
        title: "重要信息尽在一个面板",
        description: "查看进度、继续课程并知道下一步。",
      },
      {
        title: "掌握里程的路线图",
        description: "九个从基础到进阶的模块，按你的节奏学习。",
      },
      {
        title: "适合日常的课程",
        description: "观看、练习并记录学习，不会错过重点。",
      },
      {
        title: "先模拟，再决定",
        description: "把消费转化为更聪明的积分策略。",
      },
      {
        title: "比较、选择、畅游",
        description: "找到符合目标和当前阶段的计划。",
      },
      {
        title: "小任务，大收获",
        description: "总有下一步行动，把知识付诸实践。",
      },
      { title: "边玩边学", description: "测试知识、获得反馈并自信前进。" },
      {
        title: "你的旅行项目",
        description: "将完整方法应用于真实计划，从目标到兑换。",
      },
      { title: "让进步被看见", description: "用成就和证书庆祝每一个阶段。" },
      { title: "按你的方式", description: "轻松个性化资料、语言和偏好。" },
      {
        title: "你掌握主动权",
        description: "下一次旅行从今天更聪明的决定开始。",
      },
    ],
  },
};

function Icon({
  name,
  size = 20,
  stroke = 1.8,
}: {
  name: IconName;
  size?: number;
  stroke?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  const paths: Record<IconName, ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9" />
        <path d="M9 20v-6h6v6" />
      </>
    ),
    book: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
        <path d="M4 5.5v16" />
        <path d="M8 7h8M8 11h8" />
      </>
    ),
    calculator: (
      <>
        <rect x="4" y="2.8" width="16" height="18.4" rx="2" />
        <path d="M8 6.5h8M8 11h2M14 11h2M8 15h2M14 15h2M8 18.5h8" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="12" cy="12" r="1" />
        <path d="m16.5 7.5 3-3M17.5 4.5h2v2" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M4.5 20c.8-3.2 3.3-5 7.5-5s6.7 1.8 7.5 5" />
      </>
    ),
    bell: (
      <>
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.2 2.4 3.3 5.4 3.3 9s-1.1 6.6-3.3 9c-2.2-2.4-3.3-5.4-3.3-9S9.8 5.4 12 3Z" />
      </>
    ),
    arrowRight: (
      <>
        <path d="M4 12h16" />
        <path d="m13 5 7 7-7 7" />
      </>
    ),
    arrowLeft: (
      <>
        <path d="M20 12H4" />
        <path d="m11 5-7 7 7 7" />
      </>
    ),
    chevronDown: <path d="m6 9 6 6 6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    play: <path d="m9 6 9 6-9 6z" fill="currentColor" stroke="none" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
    spark: (
      <>
        <path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
        <path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    creditCard: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18M7 15h3" />
      </>
    ),
    pix: (
      <>
        <path d="m7.2 7.2 3.1-3.1a2.4 2.4 0 0 1 3.4 0l3.1 3.1" />
        <path d="m16.8 16.8-3.1 3.1a2.4 2.4 0 0 1-3.4 0l-3.1-3.1" />
        <path d="m7.2 16.8-3.1-3.1a2.4 2.4 0 0 1 0-3.4l3.1-3.1M16.8 7.2l3.1 3.1a2.4 2.4 0 0 1 0 3.4l-3.1 3.1" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V5M4 19h17" />
        <path d="m7 15 4-4 3 2 5-6" />
        <path d="M16 7h3v3" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
        <path d="M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.5v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H6v-2.5h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V4h2.5v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v2.5h-.2a1.7 1.7 0 0 0-1.5 1Z" />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    external: (
      <>
        <path d="M14 4h6v6M20 4l-9 9" />
        <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
      </>
    ),
    send: (
      <>
        <path d="m21 3-7 18-4-8-8-4z" />
        <path d="M21 3 10 13" />
      </>
    ),
    menu: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    zap: <path d="m13 2-9 12h7l-1 8 9-12h-7z" />,
    star: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z" />
    ),
    plane: (
      <>
        <path d="m3 11 18-8-8 18-2.4-7.6z" />
        <path d="M10.6 13.4 21 3" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>
    ),
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function SocialIcon({ name }: { name: "instagram" | "whatsapp" }) {
  if (name === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle
          cx="12"
          cy="12"
          r="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="17.5" cy="6.7" r="1.1" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.5 11.7a8.3 8.3 0 0 1-12.3 7.3L4 20l1.1-4.1A8.3 8.3 0 1 1 20.5 11.7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 8.1c.2-.5.5-.5.8-.5h.5c.2 0 .4.1.5.4l.8 1.8c.1.2.1.4 0 .6l-.5.7c.6 1.2 1.5 2 2.7 2.6l.7-.5c.2-.1.4-.1.6 0l1.8.8c.3.1.4.3.4.5v.5c0 .3-.1.6-.5.8-.6.3-1.3.3-2.1.1-2.1-.6-4.8-3.1-5.6-5.2-.3-.8-.3-1.5-.1-2.1Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

function ProgressBar({
  value,
  dark = false,
}: {
  value: number;
  dark?: boolean;
}) {
  return (
    <div className={`progress-track ${dark ? "progress-track-dark" : ""}`}>
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

const modules = [
  {
    number: "01",
    title: "Fundamentos das milhas",
    meta: "4 aulas • 48 min",
    state: "done",
    icon: "book" as IconName,
  },
  {
    number: "02",
    title: "Programas de fidelidade",
    meta: "5 aulas • 1h 15min",
    state: "current",
    icon: "spark" as IconName,
  },
  {
    number: "03",
    title: "Cartões que pontuam",
    meta: "6 aulas • 1h 32min",
    state: "open",
    icon: "creditCard" as IconName,
  },
];

const travelMemories = [
  {
    country: "Espanha",
    flag: "ES",
    image: "/travel-memories/espanha.jpeg",
    note: "Uma emissão bem planejada abre espaço para o inesperado.",
  },
  {
    country: "Grécia",
    flag: "GR",
    image: "/travel-memories/grecia.jpeg",
    note: "Mais que um destino: a liberdade de saber usar seus pontos.",
  },
  {
    country: "Holanda",
    flag: "NL",
    image: "/travel-memories/holanda.jpeg",
    note: "Quando o planejamento encontra o mundo.",
  },
  {
    country: "Itália",
    flag: "IT",
    image: "/travel-memories/italia.jpeg",
    note: "Viajar melhor é transformar escolhas em memórias.",
  },
  {
    country: "Portugal",
    flag: "PT",
    image: "/travel-memories/portugal.jpeg",
    note: "Começar pequeno. Chegar muito mais longe.",
  },
  {
    country: "Reino Unido",
    flag: "GB",
    image: "/travel-memories/reino-unido.jpeg",
    note: "Cada milha pode aproximar você do que parecia distante.",
  },
  {
    country: "Suíça",
    flag: "CH",
    image: "/travel-memories/suica.jpeg",
    note: "O destino muda. A estratégia fica.",
  },
  {
    country: "França",
    flag: "FR",
    image: "/travel-memories/franca.jpeg",
    note: "Paris prova que cada milha pode virar uma memória inesquecível.",
  },
];

type LessonQuestionAttempt = {
  questionId: string;
  selectedIndex: number;
  answeredAt: number;
  xpAwarded: number;
};
type LessonQuizXpEntry = { id: string; amount: number; awardedAt: number };
type LessonQuestionMode = "review" | "challenge";
type MissionView = "map" | "all" | "in-progress" | "completed";

const LESSON_QUIZ_ATTEMPTS_KEY = "domine-lesson-01-question-attempts";
const LESSON_QUIZ_XP_KEY = "domine-lesson-01-question-xp";

const siteNotice: Record<
  Lang,
  {
    demo: string;
    explore: string;
    account: string;
    payment: string;
    video: string;
  }
> = {
  "pt-BR": {
    demo: "Área de demonstração — dados de exemplo.",
    explore: "Explorar o painel",
    account:
      "Cadastro e login aguardam a configuração segura do servidor. Nenhuma conta é criada nesta versão.",
    payment:
      "Pagamento ainda não habilitado. O preço e a liberação do curso dependem da integração de produção.",
    video: "O vídeo desta aula ainda não foi fornecido.",
  },
  en: {
    demo: "Demo area — sample data.",
    explore: "Explore the dashboard",
    account:
      "Registration and sign-in require a secure server configuration. No account is created in this version.",
    payment:
      "Payments are not enabled. Pricing and course access require the production integration.",
    video: "The video for this lesson has not been provided yet.",
  },
  "pt-PT": {
    demo: "Área de demonstração — dados de exemplo.",
    explore: "Explorar o painel",
    account:
      "O registo e o início de sessão aguardam a configuração segura do servidor. Esta versão não cria contas.",
    payment:
      "Pagamentos ainda não disponíveis. O preço e o acesso ao curso dependem da integração de produção.",
    video: "O vídeo desta aula ainda não foi disponibilizado.",
  },
  es: {
    demo: "Área de demostración — datos de ejemplo.",
    explore: "Explorar el panel",
    account:
      "El registro y el acceso requieren configurar un servidor seguro. Esta versión no crea cuentas.",
    payment:
      "Los pagos aún no están habilitados. El precio y el acceso al curso requieren la integración de producción.",
    video: "El vídeo de esta lección aún no está disponible.",
  },
  ja: {
    demo: "デモエリア — サンプルデータ。",
    explore: "ダッシュボードを見る",
    account:
      "登録とログインには安全なサーバー設定が必要です。このバージョンではアカウントは作成されません。",
    payment:
      "決済はまだ有効ではありません。価格とコースへのアクセスには本番環境の連携が必要です。",
    video: "このレッスンの動画はまだ提供されていません。",
  },
  zh: {
    demo: "演示区域 — 示例数据。",
    explore: "查看控制面板",
    account: "注册和登录需要配置安全的服务器。此版本不会创建账户。",
    payment: "支付尚未启用。价格和课程访问需要正式环境集成。",
    video: "本课视频尚未提供。",
  },
};

export default function LearningSite({ pageIndex }: { pageIndex: number }) {
  const slide = pageIndex;
  const router = useRouter();
  const language = useSyncExternalStore(
    subscribeLanguage,
    readLanguage,
    serverLanguage,
  );
  const [languageOpen, setLanguageOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [guardianAuthorizationConfirmed, setGuardianAuthorizationConfirmed] =
    useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [courseAccessStatus, setCourseAccessStatus] =
    useState<CourseAccessStatus>("idle");
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(
    null,
  );
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreferenceSaving, setAvatarPreferenceSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    fullName: "",
    country: "Brasil",
    favoritePrograms: [] as string[],
  });
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [recoveryChecked, setRecoveryChecked] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  // Legacy state kept while the original prototype access panel remains in the source.
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [simulatorSpend, setSimulatorSpend] = useState(3500);
  const [simulatorMultiplier, setSimulatorMultiplier] = useState(2.2);
  const [missionCompletions, setMissionCompletions] = useState<
    MissionCompletion[]
  >([]);
  const [startedMissionKeys, setStartedMissionKeys] = useState<MissionKey[]>(
    [],
  );
  const [missionsLoaded, setMissionsLoaded] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizRetrySeconds, setQuizRetrySeconds] = useState(0);
  const [lessonQuestionMode, setLessonQuestionMode] =
    useState<LessonQuestionMode>("review");
  const [lessonQuestionAttempts, setLessonQuestionAttempts] = useState<
    LessonQuestionAttempt[]
  >([]);
  const [lessonQuizXpEntries, setLessonQuizXpEntries] = useState<
    LessonQuizXpEntry[]
  >([]);
  const [lessonQuizLoaded, setLessonQuizLoaded] = useState(false);
  const [lessonSummary, setLessonSummary] = useState<{
    mode: LessonQuestionMode;
    correct: number;
    wrong: number;
    xp: number;
  } | null>(null);
  const [missionView, setMissionView] = useState<MissionView>("map");
  const [toast, setToast] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coverMotion, setCoverMotion] = useState({
    x: 0,
    y: 0,
    rotateX: 0,
    rotateY: 0,
    scale: 1,
  });
  const [activeMemory, setActiveMemory] = useState<
    (typeof travelMemories)[number] | null
  >(null);
  const [selectedMemoryIndex, setSelectedMemoryIndex] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [testimonialDirection, setTestimonialDirection] = useState<
    "next" | "previous"
  >("next");
  const [testimonialAnimating, setTestimonialAnimating] = useState(false);
  const [presentationAudioLanguage, setPresentationAudioLanguage] =
    useState<Lang>("pt-BR");
  const travelCarouselRef = useRef<HTMLDivElement>(null);
  const testimonialTouchStart = useRef(0);
  const testimonialTransitionLock = useRef(false);
  const presentationVideoRef = useRef<HTMLVideoElement>(null);
  const presentationAudioRef = useRef<HTMLAudioElement>(null);
  const lessonQuestionLockRef = useRef(new Set<string>());
  const travelCarouselGesture = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    startIndex: 0,
    horizontalMove: 0,
    direction: "pending" as "pending" | "horizontal" | "vertical",
  });
  const memoryScrollSettleTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    if (slide !== 2) return;
    if (new URLSearchParams(window.location.search).get("mode") === "login") {
      setAuthMode("login");
    }
  }, [slide]);
  useEffect(() => {
    if (slide !== 0) return;

    const preloadTestimonialImages = [1, -1].map((offset) => {
      const index =
        (testimonialIndex + offset + travelerTestimonials.length) %
        travelerTestimonials.length;
      return travelerTestimonials[index].image;
    });

    preloadTestimonialImages.forEach((source) => {
      const image = new window.Image();
      image.src = source;
      void image.decode().catch(() => undefined);
    });
  }, [slide, testimonialIndex]);

  useEffect(() => {
    if (slide !== 0) return;

    // Oculta somente o indicador visual de rolagem enquanto a Home estiver aberta.
    const scrollRoots = [document.documentElement, document.body];
    scrollRoots.forEach((root) => root.classList.add("home-scrollbar-hidden"));

    return () => {
      scrollRoots.forEach((root) => root.classList.remove("home-scrollbar-hidden"));
    };
  }, [slide]);
  useEffect(() => {
    // AJUSTE: fallback nativo para a revelação progressiva da Home no Chrome
    // móvel, Safari e navegadores sem suporte consistente a scroll timelines.
    if (
      slide !== 0 ||
      (!HOME_HERO_MOTION.ignoreReducedMotionPreference &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    )
      return;

    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".home-flow > .hero-scroll-reveal, .home-flow > .home-reveal",
      ),
    );
    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-revealed"));
      return;
    }

    targets.forEach((target) => target.classList.add("hero-scroll-ready"));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    }, getHomeHeroRevealObserverOptions());
    const frame = window.requestAnimationFrame(() => {
      targets.forEach((target) => observer.observe(target));
    });

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      targets.forEach((target) =>
        target.classList.remove("hero-scroll-ready", "is-revealed"),
      );
    };
  }, [slide]);
  useEffect(() => {
    try {
      const savedAttempts = JSON.parse(
        window.localStorage.getItem(LESSON_QUIZ_ATTEMPTS_KEY) ?? "[]",
      );
      const savedXp = JSON.parse(
        window.localStorage.getItem(LESSON_QUIZ_XP_KEY) ?? "[]",
      );
      if (Array.isArray(savedAttempts)) {
        setLessonQuestionAttempts(savedAttempts);
        lessonQuestionLockRef.current = new Set(
          savedAttempts
            .filter(
              (item) => isLessonQuestionLocked(item.answeredAt),
            )
            .map((item) => item.questionId),
        );
      }
      if (Array.isArray(savedXp)) setLessonQuizXpEntries(savedXp);
    } catch {
      // A pessoa ainda pode responder normalmente se o navegador não tiver dados válidos.
    } finally {
      setLessonQuizLoaded(true);
    }
  }, []);
  useEffect(() => {
    if (!lessonQuizLoaded) return;
    window.localStorage.setItem(
      LESSON_QUIZ_ATTEMPTS_KEY,
      JSON.stringify(lessonQuestionAttempts),
    );
    window.localStorage.setItem(
      LESSON_QUIZ_XP_KEY,
      JSON.stringify(lessonQuizXpEntries),
    );
  }, [lessonQuestionAttempts, lessonQuizLoaded, lessonQuizXpEntries]);
  useEffect(() => {
    if (!authenticatedUser || !hasSupabaseBrowserConfig()) return;
    let active = true;
    const client = createSupabaseClient();
    void Promise.all([
      client
        .from("lesson_question_attempts")
        .select("question_id, selected_index, xp_awarded, answered_at"),
      client
        .from("xp_events")
        .select("id, points, created_at")
        .eq("source", "lesson_01_question"),
    ]).then(([attemptsResult, xpResult]) => {
        if (!active || attemptsResult.error || !attemptsResult.data) return;
        const attempts = attemptsResult.data.map((item) => ({
          questionId: item.question_id,
          selectedIndex: item.selected_index,
          answeredAt: new Date(item.answered_at).getTime(),
          xpAwarded: item.xp_awarded,
        }));
        setLessonQuestionAttempts(attempts);
        if (!xpResult.error && xpResult.data) {
          setLessonQuizXpEntries(
            xpResult.data.map((item) => ({
              id: item.id,
              amount: item.points,
              awardedAt: new Date(item.created_at).getTime(),
            })),
          );
        }
      });
    return () => { active = false; };
  }, [authenticatedUser?.id]);
  const memoryScrollAnimation = useRef<number | null>(null);
  const memoryTouchStart = useRef({ x: 0, y: 0 });
  const lastMemoryTap = useRef<{ country: string; timestamp: number }>({
    country: "",
    timestamp: 0,
  });
  const lightboxTouchStart = useRef({ x: 0, y: 0 });
  const lastLightboxTap = useRef(0);

  const copy = translations[language];
  const selectedLanguage =
    languageOptions.find((option) => option.code === language) ??
    languageOptions[0];
  const brand = localizedBrand[language];
  const accountName =
    typeof authenticatedUser?.user_metadata?.full_name === "string"
      ? authenticatedUser.user_metadata.full_name
      : (authenticatedUser?.email?.split("@")[0] ?? "Entrar");
  const profileName = studentProfile?.display_name ?? accountName;
  const googleAvatarUrl = getGoogleProfileImage(authenticatedUser);
  const preferredAvatarSource: AvatarSource =
    authenticatedUser?.user_metadata?.avatar_preference === "google"
      ? "google"
      : "uploaded";
  const selectedAvatarSource: AvatarSource =
    preferredAvatarSource === "google" || !avatarUrl ? "google" : "uploaded";
  const profileImage =
    selectedAvatarSource === "google"
      ? (googleAvatarUrl ?? avatarUrl)
      : (avatarUrl ?? googleAvatarUrl);
  const simulatorPoints = Math.round(simulatorSpend * simulatorMultiplier);
  const lessonQuestionXp = lessonQuizXpEntries.reduce(
    (total, entry) => total + entry.amount,
    0,
  );
  const earnedXp =
    missionCompletions.reduce(
      (total, mission) => total + mission.xp_earned,
      0,
    ) + lessonQuestionXp;
  const levelProgress = getLevelProgress(earnedXp);
  const isMissionComplete = (key: MissionKey) =>
    missionCompletions.some((mission) => mission.mission_key === key);
  const activeNav =
    slide === 0 ||
    slide === 1 ||
    slide === 3 ||
    slide === 4 ||
    slide === 14 ||
    slide === 15
      ? 0
      : slide === 5 || slide === 6
        ? 1
        : slide === 7 || slide === 8
          ? 2
          : slide === 9 || slide === 10 || slide === 11
            ? 3
            : 4;
  const getLessonQuestionAttempt = (questionId: string) => {
    const attempt = lessonQuestionAttempts.find(
      (item) => item.questionId === questionId,
    );
    return attempt && isLessonQuestionLocked(attempt.answeredAt)
      ? attempt
      : undefined;
  };

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const answerLessonQuestion = async (
    question: LessonQuestion,
    selectedIndex: number,
    mode: LessonQuestionMode,
  ) => {
    if (!getLessonQuestionAttempt(question.id))
      lessonQuestionLockRef.current.delete(question.id);
    if (
      !lessonQuizLoaded ||
      getLessonQuestionAttempt(question.id) ||
      lessonQuestionLockRef.current.has(question.id)
    )
      return;
    lessonQuestionLockRef.current.add(question.id);
    let answeredAt = Date.now();
    let accepted = true;
    let xpAwarded =
      selectedIndex === question.correctIndex
        ? mode === "review"
          ? 5
          : 10
        : 0;
    if (authenticatedUser && hasSupabaseBrowserConfig()) {
      const { data, error } = await createSupabaseClient().rpc(
        "record_lesson_question_attempt",
        { p_question_id: question.id, p_selected_index: selectedIndex },
      );
      if (error || !data?.[0]) { lessonQuestionLockRef.current.delete(question.id); notify("Não foi possível registrar a resposta agora."); return; }
      answeredAt = new Date(data[0].answered_at).getTime();
      xpAwarded = data[0].xp_awarded;
      accepted = data[0].newly_answered;
    }
    setLessonQuestionAttempts((current) => [
      ...current.filter((item) => item.questionId !== question.id),
      { questionId: question.id, selectedIndex, answeredAt, xpAwarded },
    ]);
    if (xpAwarded) {
      setLessonQuizXpEntries((current) =>
        mergeLessonQuestionXpEntries(current, {
          accepted,
          questionId: question.id,
          xpAwarded,
          answeredAt,
        }),
      );
      const nextLevel = getLevelProgress(earnedXp + xpAwarded);
      if (nextLevel.level > levelProgress.level)
        notify(`Novo nível! Você chegou ao nível ${nextLevel.level}.`);
    }
  };

  const scrollToMemory = (
    index: number,
    behavior: ScrollBehavior = "smooth",
  ) => {
    const nextIndex = Math.max(0, Math.min(index, travelMemories.length - 1));
    const track = travelCarouselRef.current;
    const item = track?.querySelector<HTMLElement>(
      `[data-memory-index="${nextIndex}"]`,
    );
    if (!track || !item) return;

    if (memoryScrollAnimation.current)
      cancelAnimationFrame(memoryScrollAnimation.current);
    const isMobile = window.matchMedia("(max-width: 620px)").matches;
    const paddingStart =
      Number.parseFloat(getComputedStyle(track).paddingInlineStart) || 0;
    const target = Math.max(
      0,
      Math.min(
        isMobile
          ? item.offsetLeft - paddingStart
          : item.offsetLeft + item.offsetWidth / 2 - track.clientWidth / 2,
        track.scrollWidth - track.clientWidth,
      ),
    );

    if (behavior !== "smooth") {
      track.scrollLeft = target;
      setSelectedMemoryIndex(nextIndex);
      return;
    }

    const start = track.scrollLeft;
    const distance = target - start;
    const duration = Math.min(680, Math.max(480, Math.abs(distance) * 1.7));
    const startedAt = performance.now();
    const previousSnap = track.style.scrollSnapType;
    track.style.scrollSnapType = "none";
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = -(Math.cos(Math.PI * progress) - 1) / 2;
      track.scrollLeft = start + distance * eased;
      if (progress < 1) {
        memoryScrollAnimation.current = requestAnimationFrame(animate);
        return;
      }
      track.scrollLeft = target;
      track.style.scrollSnapType = previousSnap;
      memoryScrollAnimation.current = null;
    };
    memoryScrollAnimation.current = requestAnimationFrame(animate);
    setSelectedMemoryIndex(nextIndex);
  };

  const selectNearestMemory = () => {
    const track = travelCarouselRef.current;
    if (!track) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    track
      .querySelectorAll<HTMLElement>("[data-memory-index]")
      .forEach((item) => {
        const index = Number(item.dataset.memoryIndex);
        const itemCenter = item.offsetLeft + item.offsetWidth / 2;
        const distance = Math.abs(itemCenter - center);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
    setSelectedMemoryIndex((current) =>
      current === closestIndex ? current : closestIndex,
    );
  };

  const updateSelectedMemoryFromScroll = () => {
    if (memoryScrollSettleTimer.current)
      clearTimeout(memoryScrollSettleTimer.current);
    memoryScrollSettleTimer.current = setTimeout(selectNearestMemory, 90);
  };

  const handleTravelCarouselPointerDown = (
    event: PointerEvent<HTMLDivElement>,
  ) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const track = travelCarouselRef.current;
    if (!track) return;
    if (memoryScrollAnimation.current) {
      cancelAnimationFrame(memoryScrollAnimation.current);
      memoryScrollAnimation.current = null;
      track.style.scrollSnapType = "";
    }
    travelCarouselGesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: track.scrollLeft,
      startIndex: selectedMemoryIndex,
      horizontalMove: 0,
      direction: "pending",
    };
  };

  const handleTravelCarouselPointerMove = (
    event: PointerEvent<HTMLDivElement>,
  ) => {
    const track = travelCarouselRef.current;
    const gesture = travelCarouselGesture.current;
    if (!track || gesture.pointerId !== event.pointerId) return;

    const horizontalMove = event.clientX - gesture.startX;
    const verticalMove = event.clientY - gesture.startY;
    if (
      gesture.direction === "pending" &&
      Math.max(Math.abs(horizontalMove), Math.abs(verticalMove)) > 8
    ) {
      gesture.direction =
        Math.abs(horizontalMove) > Math.abs(verticalMove)
          ? "horizontal"
          : "vertical";
    }
    if (gesture.direction !== "horizontal") return;

    gesture.horizontalMove = horizontalMove;
    track.scrollLeft = gesture.startScrollLeft - horizontalMove * 1.65;
  };

  const clearTravelCarouselGesture = (event: PointerEvent<HTMLDivElement>) => {
    if (travelCarouselGesture.current.pointerId === event.pointerId) {
      const wasHorizontal =
        travelCarouselGesture.current.direction === "horizontal";
      const horizontalMove = travelCarouselGesture.current.horizontalMove;
      const startIndex = travelCarouselGesture.current.startIndex;
      travelCarouselGesture.current.pointerId = -1;
      travelCarouselGesture.current.direction = "pending";
      if (wasHorizontal)
        requestAnimationFrame(() => {
          if (Math.abs(horizontalMove) > 18) {
            scrollToMemory(
              startIndex + (horizontalMove < 0 ? 1 : -1),
              "smooth",
            );
            return;
          }
          const track = travelCarouselRef.current;
          if (!track) return;
          const center = track.scrollLeft + track.clientWidth / 2;
          let closestIndex = 0;
          let closestDistance = Number.POSITIVE_INFINITY;
          track
            .querySelectorAll<HTMLElement>("[data-memory-index]")
            .forEach((item) => {
              const distance = Math.abs(
                item.offsetLeft + item.offsetWidth / 2 - center,
              );
              if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = Number(item.dataset.memoryIndex);
              }
            });
          scrollToMemory(closestIndex, "smooth");
        });
    }
  };

  const openMemoryFromTouch = (
    memory: (typeof travelMemories)[number],
    event: TouchEvent<HTMLButtonElement>,
  ) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    const horizontalMove = Math.abs(touch.clientX - memoryTouchStart.current.x);
    const verticalMove = Math.abs(touch.clientY - memoryTouchStart.current.y);
    if (horizontalMove > 10 || verticalMove > 10) return;
    const now = Date.now();
    if (
      lastMemoryTap.current.country === memory.country &&
      now - lastMemoryTap.current.timestamp < 650
    ) {
      setActiveMemory(memory);
      event.preventDefault();
      lastMemoryTap.current = { country: "", timestamp: 0 };
      return;
    }
    lastMemoryTap.current = { country: memory.country, timestamp: now };
  };

  const changeActiveMemory = (direction: -1 | 1) => {
    if (!activeMemory) return;
    const currentIndex = travelMemories.findIndex(
      (memory) => memory.country === activeMemory.country,
    );
    setActiveMemory(
      travelMemories[
        (currentIndex + direction + travelMemories.length) %
          travelMemories.length
      ],
    );
  };

  const handleLightboxPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch")
      lightboxTouchStart.current = { x: event.clientX, y: event.clientY };
  };

  const handleLightboxPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return;
    const horizontalMove = event.clientX - lightboxTouchStart.current.x;
    const verticalMove = Math.abs(event.clientY - lightboxTouchStart.current.y);
    if (Math.abs(horizontalMove) > 45 && verticalMove < 70) {
      changeActiveMemory(horizontalMove < 0 ? 1 : -1);
      lastLightboxTap.current = 0;
      return;
    }
    if (Math.abs(horizontalMove) > 10 || verticalMove > 10) return;
    const now = Date.now();
    if (now - lastLightboxTap.current < 360) {
      setActiveMemory(null);
      lastLightboxTap.current = 0;
      return;
    }
    lastLightboxTap.current = now;
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLanguageOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!activeMemory) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveMemory(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [activeMemory]);

  useEffect(() => {
    if (quizRetrySeconds <= 0) return;
    const timer = window.setInterval(() => {
      setQuizRetrySeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [quizRetrySeconds > 0]);

  useEffect(() => {
    if (quizRetrySeconds === 0 && quizAnswer !== null && quizAnswer !== 1) {
      setQuizAnswer(null);
    }
  }, [quizAnswer, quizRetrySeconds]);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : language;
  }, [language]);

  useEffect(() => {
    if (!hasSupabaseBrowserConfig()) return;
    const supabase = createSupabaseClient();
    void supabase.auth
      .getUser()
      .then(({ data }) => setAuthenticatedUser(data.user ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticatedUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const refreshCourseAccess = async () => {
    if (!authenticatedUser) {
      setCourseAccessStatus("idle");
      return;
    }

    setCourseAccessStatus("checking");
    try {
      const response = await fetch("/api/access/claim", { method: "POST" });
      const result = (await response.json()) as {
        access?: "granted" | "pending";
      };
      setCourseAccessStatus(
        result.access === "granted"
          ? "granted"
          : response.status === 503
            ? "unavailable"
            : "pending",
      );
    } catch {
      setCourseAccessStatus("unavailable");
    }
  };

  useEffect(() => {
    if (slide !== 3) return;
    void refreshCourseAccess();
  }, [slide, authenticatedUser?.id]);

  useEffect(() => {
    let active = true;
    if (!authenticatedUser || !hasSupabaseBrowserConfig()) {
      setStudentProfile(null);
      setAvatarUrl(null);
      setProfileLoaded(Boolean(!authenticatedUser));
      return () => {
        active = false;
      };
    }

    setProfileLoaded(false);
    const supabase = createSupabaseClient();
    void supabase
      .from("student_profiles")
      .select(
        "user_id, display_name, full_name, country, favorite_programs, language_code, avatar_path",
      )
      .eq("user_id", authenticatedUser.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.warn("Could not load student profile", error);
          notify("Não foi possível carregar seu perfil agora.");
        }
        const profile = (data as StudentProfile | null) ?? null;
        setStudentProfile(profile);
        setProfileForm({
          displayName:
            profile?.display_name ??
            authenticatedUser.email?.split("@")[0] ??
            "",
          fullName: profile?.full_name ?? "",
          country: profile?.country ?? "Brasil",
          favoritePrograms: profile?.favorite_programs ?? [],
        });
        setProfileLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [authenticatedUser]);

  useEffect(() => {
    let active = true;
    if (!authenticatedUser || !hasSupabaseBrowserConfig()) {
      setStartedMissionKeys([]);
      return () => {
        active = false;
      };
    }

    const supabase = createSupabaseClient();
    void supabase
      .from("learning_mission_starts")
      .select("mission_key")
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.warn("Could not load started missions", error);
          return;
        }
        setStartedMissionKeys(
          (data ?? []).map((mission) => mission.mission_key as MissionKey),
        );
      });

    return () => {
      active = false;
    };
  }, [authenticatedUser]);

  useEffect(() => {
    let active = true;
    if (!authenticatedUser || !hasSupabaseBrowserConfig()) {
      setMissionCompletions([]);
      setMissionsLoaded(Boolean(!authenticatedUser));
      return () => {
        active = false;
      };
    }

    setMissionsLoaded(false);
    const supabase = createSupabaseClient();
    void supabase
      .from("learning_mission_completions")
      .select("mission_key, xp_earned, completed_at")
      .order("completed_at", { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.warn("Could not load mission progress", error);
          setMissionCompletions([]);
        } else {
          setMissionCompletions((data ?? []) as MissionCompletion[]);
        }
        setMissionsLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [authenticatedUser]);

  useEffect(() => {
    let active = true;
    if (!authenticatedUser || !hasSupabaseBrowserConfig()) {
      setQuizRetrySeconds(0);
      return () => {
        active = false;
      };
    }

    const supabase = createSupabaseClient();
    void supabase
      .from("quiz_attempt_locks")
      .select("locked_until")
      .eq("quiz_key", "module_01_question_01")
      .gt("locked_until", new Date().toISOString())
      .order("locked_until", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.warn("Could not load quiz retry lock", error);
          return;
        }
        const remaining = data?.locked_until
          ? Math.max(
              0,
              Math.ceil(
                (new Date(data.locked_until).getTime() - Date.now()) / 1000,
              ),
            )
          : 0;
        setQuizRetrySeconds(remaining);
      });

    return () => {
      active = false;
    };
  }, [authenticatedUser]);

  useEffect(() => {
    let active = true;
    if (!studentProfile?.avatar_path || !hasSupabaseBrowserConfig()) {
      setAvatarUrl(null);
      return () => {
        active = false;
      };
    }

    const supabase = createSupabaseClient();
    void supabase.storage
      .from("avatars")
      .createSignedUrl(studentProfile.avatar_path, 60 * 60)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.warn("Could not load avatar", error);
          setAvatarUrl(null);
          return;
        }
        setAvatarUrl(data.signedUrl);
      });

    return () => {
      active = false;
    };
  }, [studentProfile?.avatar_path]);

  useEffect(() => {
    if (slide !== 16 || !hasSupabaseBrowserConfig()) return;
    let active = true;
    const supabase = createSupabaseClient();
    const recoveryMarker = "milhas-rotadas-password-recovery";
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        window.sessionStorage.setItem(recoveryMarker, "1");
        setRecoveryReady(true);
      }
    });

    void (async () => {
      const query = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const recoveryCode = query.get("code");
      const cameFromRecoveryLink =
        query.get("type") === "recovery" ||
        hash.get("type") === "recovery" ||
        query.get("recovery") === "1";

      // With PKCE, Supabase puts a one-time `code` in the URL. It has to be
      // exchanged before updateUser can accept a new password.
      if (recoveryCode) {
        const { data, error } =
          await supabase.auth.exchangeCodeForSession(recoveryCode);
        if (!active) return;
        if (!error && data.session) {
          window.sessionStorage.setItem(recoveryMarker, "1");
          setRecoveryReady(true);
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        } else {
          console.warn("Password recovery code could not be exchanged", error);
        }
        setRecoveryChecked(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;
      // A normal signed-in session must not be mistaken for a recovery link.
      if (
        data.session &&
        (cameFromRecoveryLink ||
          window.sessionStorage.getItem(recoveryMarker) === "1")
      ) {
        window.sessionStorage.setItem(recoveryMarker, "1");
        setRecoveryReady(true);
      }
      setRecoveryChecked(true);
    })();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [slide]);

  // Translate the React tree, never mutate React-owned DOM text nodes.
  const localize = (nodes: ReactNode): ReactNode =>
    Children.map(nodes, (node) => {
      if (typeof node === "string")
        return translateVisibleValue(node, language);
      if (!isValidElement<Record<string, unknown>>(node)) return node;
      const props: Record<string, unknown> = {};
      for (const attr of ["title", "alt", "aria-label", "placeholder"]) {
        if (typeof node.props[attr] === "string")
          props[attr] = translateVisibleValue(
            node.props[attr] as string,
            language,
          );
      }
      if (node.props.children !== undefined)
        props.children = localize(node.props.children as ReactNode);
      return cloneElement(node, props);
    });

  const presentationAudioSources: Record<Lang, string | null> = {
    "pt-BR": null,
    en: "/presentation/audio-en.mp3",
    "pt-PT": "/presentation/audio-pt-PT.mp3",
    es: "/presentation/audio-es.mp3",
    ja: "/presentation/audio-ja.mp3",
    zh: "/presentation/audio-zh.mp3",
  };

  const syncPresentationAudio = () => {
    const video = presentationVideoRef.current;
    const audio = presentationAudioRef.current;
    if (!video || !audio || presentationAudioLanguage === "pt-BR") return;
    audio.preservesPitch = true;
    audio.playbackRate = video.playbackRate;
    const targetAudioTime = Math.min(audio.duration, video.currentTime);
    if (Math.abs(audio.currentTime - targetAudioTime) > 0.25)
      audio.currentTime = targetAudioTime;
    if (
      !video.paused &&
      Number.isFinite(audio.duration) &&
      video.currentTime >= audio.duration
    ) {
      audio.pause();
      video.pause();
    }
  };

  useEffect(() => {
    const video = presentationVideoRef.current;
    const audio = presentationAudioRef.current;
    if (!video) return;

    for (const track of Array.from(video.textTracks)) {
      track.mode =
        track.language === presentationAudioLanguage ? "showing" : "disabled";
    }

    if (presentationAudioLanguage === "pt-BR") {
      audio?.pause();
      if (audio) audio.playbackRate = 1;
      video.muted = false;
      return;
    }

    video.muted = true;
    if (!audio) return;
    const startTranslatedAudio = () => {
      syncPresentationAudio();
      if (!video.paused) void audio.play().catch(() => undefined);
    };
    if (audio.readyState >= 1) startTranslatedAudio();
    else
      audio.addEventListener("loadedmetadata", startTranslatedAudio, {
        once: true,
      });
    return () =>
      audio.removeEventListener("loadedmetadata", startTranslatedAudio);
  }, [presentationAudioLanguage]);

  const selectLanguage = (code: Lang) => {
    try {
      window.localStorage.setItem("domine-language", code);
    } catch {
      return;
    }
    if (authenticatedUser && studentProfile && hasSupabaseBrowserConfig()) {
      const supabase = createSupabaseClient();
      void supabase
        .from("student_profiles")
        .update({ language_code: code, updated_at: new Date().toISOString() })
        .eq("user_id", authenticatedUser.id)
        .then(({ error }) => {
          if (error) console.warn("Could not save language preference", error);
          else
            setStudentProfile((current) =>
              current ? { ...current, language_code: code } : current,
            );
        });
    }
    window.dispatchEvent(new Event("domine-language-change"));
    setLanguageOpen(false);
    notify(translations[code].saved);
  };

  const toggleFavoriteProgram = (program: string) => {
    setProfileForm((current) => ({
      ...current,
      favoritePrograms: current.favoritePrograms.includes(program)
        ? current.favoritePrograms.filter((item) => item !== program)
        : [...current.favoritePrograms, program],
    }));
  };

  const profileCompletesMission = (profile: StudentProfile) =>
    profile.display_name.trim().length >= 2 &&
    profile.full_name.trim().length >= 2 &&
    Boolean(profile.country) &&
    profile.favorite_programs.length > 0;

  const completeMission = async (
    missionKey: MissionKey,
    options?: { silent?: boolean },
  ) => {
    if (!authenticatedUser || !hasSupabaseBrowserConfig()) {
      router.push("/cadastro?next=%2Fmissoes");
      return false;
    }

    const supabase = createSupabaseClient();
    const { data, error } = await supabase.rpc("complete_learning_mission", {
      p_mission_key: missionKey,
    });

    if (error) {
      console.warn("Could not complete mission", error);
      if (!options?.silent)
        notify(
          "Não foi possível registrar esta missão agora. Tente novamente.",
        );
      return false;
    }

    const completion = Array.isArray(data) ? data[0] : data;
    if (!completion) {
      if (!options?.silent)
        notify(
          "Não foi possível registrar esta missão agora. Tente novamente.",
        );
      return false;
    }
    const newlyCompleted = completion.newly_completed;
    setMissionCompletions((current) =>
      current.some((mission) => mission.mission_key === missionKey)
        ? current
        : [
            ...current,
            {
              mission_key: completion.mission_key,
              xp_earned: completion.xp_earned,
              completed_at: completion.completed_at,
            },
          ],
    );
    if (!options?.silent) {
      const nextLevel = getLevelProgress(
        earnedXp + (newlyCompleted ? completion.xp_earned : 0),
      );
      notify(
        newlyCompleted
          ? nextLevel.level > levelProgress.level
            ? `Missão concluída! +${completion.xp_earned} XP · Você chegou ao nível ${nextLevel.level}!`
            : `Missão concluída! +${completion.xp_earned} XP`
          : "Esta missão já foi concluída.",
      );
    }
    return newlyCompleted;
  };

  const startMission = async (missionKey: MissionKey, destination: number) => {
    if (!authenticatedUser || !hasSupabaseBrowserConfig()) {
      router.push(
        `/cadastro?next=${encodeURIComponent(siteRoutes[destination].path)}`,
      );
      return;
    }

    setStartedMissionKeys((current) =>
      current.includes(missionKey) ? current : [...current, missionKey],
    );
    goTo(destination);
    void createSupabaseClient()
      .from("learning_mission_starts")
      .insert({ user_id: authenticatedUser.id, mission_key: missionKey })
      .then(({ error }) => {
        if (error && error.code !== "23505")
          console.warn("Could not record started mission", error);
      });
  };

  // Existing profiles are also eligible: a student should not need to save the
  // same completed information again just because missions were added later.
  useEffect(() => {
    // Wait for the student\'s recorded missions before attempting the one-time
    // backfill. Otherwise a completed profile can race the first mission fetch
    // on page load and surface an unnecessary error toast.
    if (
      !missionsLoaded ||
      !authenticatedUser ||
      !studentProfile ||
      isMissionComplete("profile_complete")
    )
      return;
    if (profileCompletesMission(studentProfile)) {
      void completeMission("profile_complete", { silent: true });
    }
  }, [
    missionsLoaded,
    authenticatedUser?.id,
    studentProfile?.display_name,
    studentProfile?.full_name,
    studentProfile?.country,
    studentProfile?.favorite_programs,
    missionCompletions,
  ]);

  const saveStudentProfile = async () => {
    if (!authenticatedUser || !hasSupabaseBrowserConfig()) {
      router.push("/cadastro?next=%2Fperfil");
      return;
    }
    const displayName = profileForm.displayName.trim();
    const fullName = profileForm.fullName.trim();
    if (displayName.length < 2 || fullName.length < 2) {
      notify("Informe seu nome de usuário e seu nome completo.");
      return;
    }

    setProfileSaving(true);
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase
        .from("student_profiles")
        .upsert({
          user_id: authenticatedUser.id,
          display_name: displayName,
          full_name: fullName,
          country: profileForm.country,
          favorite_programs: profileForm.favoritePrograms,
          language_code: language,
          avatar_path: studentProfile?.avatar_path ?? null,
          updated_at: new Date().toISOString(),
        })
        .select(
          "user_id, display_name, full_name, country, favorite_programs, language_code, avatar_path",
        )
        .single();
      if (error) throw error;
      const savedProfile = data as StudentProfile;
      setStudentProfile(savedProfile);
      const earnedProfileXp = profileCompletesMission(savedProfile)
        ? await completeMission("profile_complete", { silent: true })
        : false;
      notify(
        earnedProfileXp
          ? "Perfil completo! Missão concluída: +20 XP."
          : "Perfil salvo com segurança.",
      );
    } catch (error) {
      console.warn("Could not save student profile", error);
      notify("Não foi possível salvar seu perfil agora. Tente novamente.");
    } finally {
      setProfileSaving(false);
    }
  };

  const uploadAvatar = async (file: File | undefined) => {
    if (
      !file ||
      !authenticatedUser ||
      !studentProfile ||
      !hasSupabaseBrowserConfig()
    )
      return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type) || file.size > 2 * 1024 * 1024) {
      notify("Escolha uma imagem JPG, PNG ou WebP de até 2 MB.");
      return;
    }

    const extension =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";
    const newPath = `${authenticatedUser.id}/${crypto.randomUUID()}.${extension}`;
    setAvatarUploading(true);
    try {
      const supabase = createSupabaseClient();
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(newPath, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { data, error: profileError } = await supabase
        .from("student_profiles")
        .update({ avatar_path: newPath, updated_at: new Date().toISOString() })
        .eq("user_id", authenticatedUser.id)
        .select(
          "user_id, display_name, full_name, country, favorite_programs, language_code, avatar_path",
        )
        .single();
      if (profileError) {
        await supabase.storage.from("avatars").remove([newPath]);
        throw profileError;
      }

      if (studentProfile.avatar_path)
        await supabase.storage
          .from("avatars")
          .remove([studentProfile.avatar_path]);
      const savedProfile = data as StudentProfile;
      setStudentProfile(savedProfile);
      const earnedProfileXp = profileCompletesMission(savedProfile)
        ? await completeMission("profile_complete", { silent: true })
        : false;
      notify(
        earnedProfileXp
          ? "Perfil completo! Missão concluída: +20 XP."
          : "Foto de perfil atualizada.",
      );
    } catch (error) {
      console.warn("Could not upload avatar", error);
      notify("Não foi possível enviar a foto agora. Tente novamente.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const saveAvatarPreference = async (source: AvatarSource) => {
    if (!authenticatedUser || !hasSupabaseBrowserConfig()) return;
    if (source === "google" && !googleAvatarUrl) {
      notify("A foto da conta Google não está disponível neste login.");
      return;
    }
    if (source === "uploaded" && !avatarUrl) {
      notify("Envie uma foto pelo perfil antes de escolhê-la.");
      return;
    }

    setAvatarPreferenceSaving(true);
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase.auth.updateUser({
        data: { ...authenticatedUser.user_metadata, avatar_preference: source },
      });
      if (error) throw error;
      if (data.user) setAuthenticatedUser(data.user);
      notify(
        source === "google"
          ? "A foto da sua conta Google agora é a principal."
          : "A foto enviada agora é a principal.",
      );
    } catch (error) {
      console.warn("Could not save avatar preference", error);
      notify(
        "Não foi possível salvar sua foto principal agora. Tente novamente.",
      );
    } finally {
      setAvatarPreferenceSaving(false);
    }
  };

  const goTo = (index: number) => {
    router.push(
      siteRoutes[Math.max(0, Math.min(siteRoutes.length - 1, index))].path,
    );
    setMobileMenuOpen(false);
  };

  const handleAccountAccess = async () => {
    if (
      authMode === "signup" &&
      !canContinueWithGuardianAuthorization(guardianAuthorizationConfirmed)
    ) {
      notify(
        translateVisibleValue(
          "Para continuar, confirme que tem 18 anos ou a autorização do seu responsável legal.",
          language,
        ),
      );
      return;
    }
    if (!hasSupabaseBrowserConfig()) {
      notify(
        "O acesso seguro está sendo configurado. Tente novamente em instantes.",
      );
      return;
    }
    if (!authEmail || !authPassword) {
      notify("Preencha seu e-mail e uma senha de acesso.");
      return;
    }

    setAuthBusy(true);
    try {
      const supabase = createSupabaseClient();
      const result =
        authMode === "signup"
          ? await supabase.auth.signUp({
              email: authEmail,
              password: authPassword,
            })
          : await supabase.auth.signInWithPassword({
              email: authEmail,
              password: authPassword,
            });
      if (result.error) throw result.error;

      if (!result.data.session) {
        const existingAccount =
          authMode === "signup" && result.data.user?.identities?.length === 0;

        if (existingAccount) {
          setAuthMode("login");
          notify(
            "Esta conta já existe. Entre com sua senha ou use 'Esqueci minha senha'.",
          );
        } else {
          notify(
            "Confira seu e-mail para confirmar sua conta e depois entre na plataforma.",
          );
        }
        return;
      }
      const claim = await fetch("/api/access/claim", { method: "POST" });
      const claimResult = (await claim.json()) as { access?: string };
      if (claimResult.access === "granted") {
        router.push("/curso");
      } else {
        router.push("/boas-vindas?status=pending");
      }
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Não foi possível acessar sua conta agora.",
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const handleGoogleAccess = async () => {
    if (
      authMode === "signup" &&
      !canContinueWithGuardianAuthorization(guardianAuthorizationConfirmed)
    ) {
      notify(
        translateVisibleValue(
          "Para continuar, confirme que tem 18 anos ou a autorização do seu responsável legal.",
          language,
        ),
      );
      return;
    }
    if (!hasSupabaseBrowserConfig()) {
      notify(
        "O acesso seguro está sendo configurado. Tente novamente em instantes.",
      );
      return;
    }

    setAuthBusy(true);
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // The callback exchanges the PKCE code and checks paid access server-side.
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.warn("Google sign-in could not be started", error);
      notify(
        "Não foi possível iniciar com Google. Confira a configuração e tente novamente.",
      );
      setAuthBusy(false);
    }
  };

  const requestPasswordRecovery = async () => {
    if (!hasSupabaseBrowserConfig()) {
      notify(
        "A recuperação de senha está sendo configurada. Tente novamente em instantes.",
      );
      return;
    }
    if (!authEmail.trim()) {
      notify("Informe seu e-mail para receber o link de recuperação.");
      return;
    }
    setAuthBusy(true);
    let requestStarted = false;
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        authEmail.trim(),
        {
          // Keep recovery separate from the OAuth callback so it can never be
          // mistaken for a regular sign-in after the one-time code is exchanged.
          redirectTo: `${window.location.origin}/auth/recovery`,
        },
      );
      if (error) throw error;
      requestStarted = true;
    } catch (error) {
      const authError = error as { message?: string; code?: string };
      const detail = authError.message?.toLowerCase() ?? "";
      // Keep this response neutral so the form never reveals which e-mails have accounts.
      if (
        authError.code === "over_email_send_rate_limit" ||
        detail.includes("email rate limit")
      ) {
        notify(
          "O limite de e-mails do projeto foi atingido. Aguarde até uma hora e tente novamente.",
        );
      } else if (
        detail.includes("rate limit") ||
        detail.includes("too many") ||
        detail.includes("security purposes")
      ) {
        notify(
          "Muitas solicitações de recuperação foram feitas. Aguarde um minuto e tente novamente.",
        );
      } else if (
        detail.includes("email") &&
        (detail.includes("send") || detail.includes("provider"))
      ) {
        notify(
          "O envio do e-mail está temporariamente indisponível. Tente novamente em alguns minutos.",
        );
      } else {
        notify(
          "Não foi possível iniciar a recuperação agora. Tente novamente em alguns instantes.",
        );
      }
      console.warn("Password recovery request could not be started", error);
    } finally {
      setAuthBusy(false);
      // This message intentionally does not reveal whether the e-mail has an account.
      if (requestStarted)
        notify(
          "Se houver uma conta com este e-mail, enviaremos um link seguro para redefinir a senha.",
        );
    }
  };

  const handlePasswordUpdate = async () => {
    if (newPassword.length < 8) {
      notify("Use uma senha com pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== newPasswordConfirmation) {
      notify("As senhas não conferem. Verifique e tente novamente.");
      return;
    }
    setAuthBusy(true);
    try {
      const supabase = createSupabaseClient();
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) {
        notify(
          "Este link de recuperação expirou ou já foi usado. Solicite um novo link.",
        );
        return;
      }
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        const detail = error.message.toLowerCase();
        if (
          detail.includes("same password") ||
          detail.includes("different password") ||
          detail.includes("same as") ||
          detail.includes("previous password") ||
          detail.includes("old password")
        ) {
          notify("Escolha uma senha diferente da anterior.");
        } else if (
          detail.includes("session") ||
          detail.includes("token") ||
          detail.includes("jwt")
        ) {
          notify(
            "Este link de recuperação expirou ou já foi usado. Solicite um novo link.",
          );
        } else {
          notify(
            "Não foi possível atualizar a senha agora. Tente novamente em alguns instantes.",
          );
        }
        return;
      }
      await supabase.auth.signOut({ scope: "local" });
      window.sessionStorage.removeItem("milhas-rotadas-password-recovery");
      setPasswordUpdated(true);
      setNewPassword("");
      setNewPasswordConfirmation("");
    } catch (error) {
      console.warn("Password update could not be completed", error);
      notify(
        "Não foi possível atualizar a senha agora. Tente novamente em alguns instantes.",
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const signOutCurrentAccount = async () => {
    if (!hasSupabaseBrowserConfig()) {
      notify("Não foi possível encerrar a sessão agora. Tente novamente.");
      return;
    }

    setSigningOut(true);
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;

      setMobileMenuOpen(false);
      router.push("/cadastro?next=%2Fperfil");
    } catch (error) {
      console.warn("Could not sign out", error);
      notify("Não foi possível sair da conta agora. Tente novamente.");
      setSigningOut(false);
    }
  };

  const handleCoverPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const normalizedX = Math.max(
      -1,
      Math.min(
        1,
        (event.clientX - (bounds.left + bounds.width / 2)) / (bounds.width / 2),
      ),
    );
    const normalizedY = Math.max(
      -1,
      Math.min(
        1,
        (event.clientY - (bounds.top + bounds.height / 2)) /
          (bounds.height / 2),
      ),
    );
    setCoverMotion({
      x: normalizedX,
      y: normalizedY,
      rotateX: normalizedY * -5,
      rotateY: normalizedX * 7,
      scale: 1.012,
    });
  };

  const handleCoverPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setCoverMotion((current) => ({ ...current, scale: 1.025 }));
  };

  const resetCoverMotion = () =>
    setCoverMotion({ x: 0, y: 0, rotateX: 0, rotateY: 0, scale: 1 });

  const renderHeader = () => (
    <header className="top-header">
      <div className="header-inner">
        <button
          className="brand"
          onClick={() => goTo(0)}
          aria-label={`${brand.name} — ${brand.tagline}`}
        >
          <span className="brand-mark">
            <Icon name="plane" size={17} />
          </span>
          <span>
            <strong>{brand.name}</strong>
            <em>{brand.tagline}</em>
          </span>
        </button>
        <div className="header-right">
          <Link className="header-course-link" href="/curso">
            Curso <Icon name="arrowRight" size={14} />
          </Link>
          <div className="language-wrap">
            <button
              className={`language-trigger ${languageOpen ? "is-open" : ""}`}
              onClick={() => setLanguageOpen((open) => !open)}
              aria-expanded={languageOpen}
            >
              <Icon name="globe" size={16} />
              <img
                className="country-flag"
                src={`/flags/${selectedLanguage.flag}.svg`}
                alt=""
              />
              <span>{language}</span>
              <Icon name="chevronDown" size={14} />
            </button>
            {languageOpen && (
              <div className="language-menu">
                <div className="language-menu-title">
                  <Icon name="globe" size={15} /> {copy.selectLanguage}
                </div>
                {languageOptions.map((option) => (
                  <button
                    key={option.code}
                    className={`language-option ${option.code === language ? "selected" : ""}`}
                    onClick={() => selectLanguage(option.code)}
                  >
                    <span className="language-flag">
                      <img
                        className="country-flag"
                        src={`/flags/${option.flag}.svg`}
                        alt=""
                      />
                    </span>
                    <span>
                      <b>{option.native}</b>
                      <small>{option.label}</small>
                    </span>
                    {option.code === language && (
                      <Icon name="check" size={16} />
                    )}
                  </button>
                ))}
                <p className="language-hint">{copy.saved}</p>
              </div>
            )}
          </div>
          <button
            className="icon-button notification-button"
            aria-label="Notificações"
            onClick={() => notify("Você não tem novas notificações")}
          >
            {" "}
            <Icon name="bell" size={19} />
            <span />
          </button>
          {authenticatedUser ? (
            <button
              className="profile-chip"
              onClick={() => goTo(13)}
              aria-label={`Abrir perfil de ${profileName}`}
            >
              <span className="profile-avatar">
                {profileImage ? (
                  <img src={profileImage} alt="" referrerPolicy="no-referrer" />
                ) : (
                  <Icon name="user" size={17} />
                )}
              </span>
              <span className="profile-name">{profileName}</span>
              <Icon name="chevronDown" size={14} />
            </button>
          ) : (
            <Link
              className="profile-chip profile-chip-guest"
              href="/cadastro"
              aria-label="Entrar ou criar conta"
            >
              <span className="profile-avatar">
                <Icon name="user" size={17} />
              </span>
              <span className="profile-name">Entrar</span>
            </Link>
          )}
          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Abrir menu"
          >
            <Icon name={mobileMenuOpen ? "close" : "menu"} size={21} />
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="mobile-header-menu">
          <button onClick={() => goTo(13)}>
            <Icon name="user" size={17} /> {copy.profile}
          </button>
          <button
            onClick={() => {
              setLanguageOpen(true);
              setMobileMenuOpen(false);
            }}
          >
            <Icon name="globe" size={17} /> {copy.language}
          </button>
        </div>
      )}
    </header>
  );

  const renderBottomNav = () => (
    <nav className="bottom-nav" aria-label="Navegação principal">
      <div className="bottom-nav-inner">
        {[
          { icon: "home" as IconName, target: 0 },
          { icon: "book" as IconName, target: 5 },
          { icon: "calculator" as IconName, target: 7 },
          { icon: "target" as IconName, target: 9 },
          { icon: "user" as IconName, target: 13 },
        ].map((item, index) => (
          <Link
            key={item.icon}
            href={siteRoutes[item.target].path}
            aria-current={activeNav === index ? "page" : undefined}
            className={`bottom-nav-item ${activeNav === index ? "active" : ""}`}
          >
            <span className="bottom-nav-icon">
              <Icon name={item.icon} size={22} />
            </span>
            <span>{copy.nav[index]}</span>
          </Link>
        ))}
      </div>
    </nav>
  );

  const renderSocialShortcuts = () => (
    <aside className="social-shortcuts" aria-label="Canais de atendimento">
      <a
        className="social-shortcut social-instagram"
        href="https://www.instagram.com/milhasrotadas?stkn=MWcyOHBtYTdhcTUxYw%3D%3D&utm_source=qr"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Abrir Instagram Milhas Rotadas"
      >
        <SocialIcon name="instagram" />
        <span>Instagram</span>
      </a>
      <a
        className="social-shortcut social-whatsapp"
        href="https://wa.me/559492645958"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Abrir conversa no WhatsApp"
      >
        <SocialIcon name="whatsapp" />
        <span>WhatsApp</span>
      </a>
    </aside>
  );

  const renderCover = () => (
    <div
      className="cover-layout home-hero"
      style={
        {
          "--home-hero-motion-distance": `${HOME_HERO_MOTION.distance}px`,
          "--home-hero-mobile-motion-distance": `${HOME_HERO_MOTION.mobileDistance}px`,
        } as CSSProperties
      }
    >
      <div className="cover-copy hero-content-layer">
        <div className="eyebrow accent-eyebrow hero-entrance hero-entrance--eyebrow">
          <span className="eyebrow-line" /> {translateVisibleValue("EXPERIÊNCIA DE APRENDIZADO", language)}
        </div>
        <h2 className="hero-entrance hero-entrance--title" role="heading" aria-level={1}>
          {copy.slides[0].title}
          <span className="headline-dot">.</span>
        </h2>
        <p className="cover-subtitle hero-entrance hero-entrance--subtitle">{copy.slides[0].description}</p>
        <div className="cover-actions hero-entrance hero-entrance--actions">
          <button
            className="button button-primary button-large"
            onClick={() => goTo(15)}
          >
            {copy.start} <Icon name="arrowRight" size={18} />
          </button>
          <button
            className="text-button"
            onClick={() =>
              document
                .getElementById("introducao")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            {translateVisibleValue("Explorar a plataforma", language)} <Icon name="arrowRight" size={15} />
          </button>
        </div>
        <div className="cover-proof hero-entrance hero-entrance--proof">
          <div className="proof-avatars">
            <span>ML</span>
            <span>AC</span>
            <span>RS</span>
            <span>+</span>
          </div>
          <span>
            {translateVisibleValue("Aprenda no seu ritmo", language)}
            <br />
            <b>{translateVisibleValue("e viaje mais longe.", language)}</b>
          </span>
        </div>
        <div className="hero-learning-cards">
          <div className="hero-study-card" aria-label="Estudo mais eficiente">
            <span className="hero-study-icon" aria-hidden="true">
              <Icon name="book" size={16} />
            </span>
            <div>
              <small>ESTUDO MAIS EFICIENTE</small>
              <strong>Aprenda no seu ritmo</strong>
              <span>8 movimentos para evoluir</span>
            </div>
          </div>
          <div className="hero-level-card" aria-label="Seu progresso de nível">
            <span className="hero-level-icon" aria-hidden="true">
              <Icon name="trophy" size={17} />
            </span>
            <div>
              <small>SEU NÍVEL</small>
              <strong>Nível {missionsLoaded ? levelProgress.level : 0}</strong>
              <span>
                {missionsLoaded
                  ? `${levelProgress.xpIntoLevel} / ${levelProgress.xpToNextLevel} XP`
                  : "Carregando XP"}
              </span>
            </div>
            <span className="hero-level-progress" aria-hidden="true">
              <i
                style={{
                  width: `${missionsLoaded ? levelProgress.progressPercent : 0}%`,
                }}
              />
            </span>
          </div>
        </div>
      </div>
      <div
        className="cover-visual"
        onPointerMove={handleCoverPointerMove}
        onPointerDown={handleCoverPointerDown}
        onPointerUp={resetCoverMotion}
        onPointerCancel={resetCoverMotion}
        onPointerLeave={resetCoverMotion}
        aria-label={translateVisibleValue(
          "Cena 3D interativa da capa",
          language,
        )}
      >
        <div className="hero-depth-grid" aria-hidden="true" />
        <div className="hero-ambient-ring hero-ambient-ring--one" aria-hidden="true" />
        <div className="hero-ambient-ring hero-ambient-ring--two" aria-hidden="true" />
        {/* The supplied source does not contain premium-travel.jpg. Preserve its animated layer without a broken image. */}
        <div
          className="cover-photo"
          aria-hidden="true"
          style={{
            transform: `translate3d(${coverMotion.x * 8}px, ${coverMotion.y * 5}px, 0) scale(1.06)`,
          }}
        />
        <div className="visual-glow" />
        <div
          className="orbit orbit-one"
          style={{
            transform: `translate3d(${coverMotion.x * 5}px, ${coverMotion.y * 4}px, 0) rotate(-19deg)`,
          }}
        />
        <div
          className="orbit orbit-two"
          style={{
            transform: `translate3d(${coverMotion.x * -4}px, ${coverMotion.y * -3}px, 0) rotate(35deg)`,
          }}
        />
        <div
          className="ticket-card"
          style={{
            transform: `translate3d(${coverMotion.x * 10}px, ${coverMotion.y * 7}px, 0) rotateX(${coverMotion.rotateX}deg) rotateY(${coverMotion.rotateY}deg) rotateZ(-7deg) scale(${coverMotion.scale})`,
          }}
        >
          <div className="ticket-top">
            <span className="ticket-logo">
              <Icon name="plane" size={15} />
            </span>
            <span>DSM / 2026</span>
            <span className="ticket-status">{translateVisibleValue("ATIVO", language)}</span>
          </div>
          <div className="ticket-route">
            <div>
              <small>{translateVisibleValue("ORIGEM", language)}</small>
              <strong>GRU</strong>
              <span>{translateVisibleValue("São Paulo", language)}</span>
            </div>
            <div className="route-line">
              <Icon name="plane" size={19} />
              <i />
            </div>
            <div className="ticket-destination">
              <small>{translateVisibleValue("DESTINO", language)}</small>
              <strong>CDG</strong>
              <span>{translateVisibleValue("Paris, França", language)}</span>
            </div>
          </div>
          <div className="ticket-footer">
            <span>
              {translateVisibleValue("PASSAGEIRO", language)}<strong>João Silva</strong>
            </span>
            <span>
              {translateVisibleValue("VALOR", language)}<strong>23.800 pts</strong>
            </span>
          </div>
        </div>
        <div
          className="visual-caption"
          style={{
            transform: `translate3d(${coverMotion.x * 3}px, ${coverMotion.y * 2}px, 0)`,
          }}
        >
          <span className="caption-dot" /> {translateVisibleValue("Conhecimento que decola", language)}
        </div>
      </div>
    </div>
  );

  const renderConcept = () => {
    const pillars = [
      {
        icon: "book" as IconName,
        label: "APRENDER",
        text: "Conteúdo em vídeo e texto",
        tone: "blue",
      },
      {
        icon: "target" as IconName,
        label: "PRATICAR",
        text: "Exercícios e quizzes",
        tone: "yellow",
      },
      {
        icon: "calculator" as IconName,
        label: "SIMULAR",
        text: "Calcule o valor real",
        tone: "navy",
      },
      {
        icon: "trophy" as IconName,
        label: "EVOLUIR",
        text: "Ganhe XP e conquiste",
        tone: "mint",
      },
    ];
    return (
      <>
        <div className="concept-layout">
          <div className="concept-intro">
            <span className="number-badge">01 — 04</span>
            <h3>
              De iniciante a<br />
              <span>estrategista.</span>
            </h3>
            <p>
              Uma jornada guiada para você tomar decisões melhores com seus
              pontos — sem complicação e sem achismo.
            </p>
            <div className="journey-line">
              <span className="journey-node active" />
              <span />
              <span className="journey-node" />
              <span />
              <span className="journey-node" />
              <span />
              <span className="journey-node" />
            </div>
            <div className="journey-labels">
              <span>Descobrir</span>
              <span>Aplicar</span>
              <span>Conquistar</span>
            </div>
          </div>
          <div className="pillar-grid">
            {pillars.map((pillar, index) => (
              <div className={`pillar-card motion-stagger-card ${pillar.tone}`} key={pillar.label}>
                <span className="pillar-number">0{index + 1}</span>
                <div className="pillar-icon">
                  <Icon name={pillar.icon} size={25} />
                </div>
                <h4>{pillar.label}</h4>
                <p>{pillar.text}</p>
                <span className="pillar-arrow">
                  <Icon name="arrowRight" size={15} />
                </span>
              </div>
            ))}
          </div>
          <div className="concept-note">
            <Icon name="spark" size={18} />
            <span>
              <b>Uma jornada completa</b> — do básico ao avançado, com clareza
              em cada passo.
            </span>
          </div>
        </div>
        <section className="concept-enrollment card-surface">
          <div>
            <span className="small-label">PRONTO PARA COMEÇAR?</span>
            <h3>Transforme o próximo destino em um plano possível.</h3>
            <p>
              Pagamento seguro, acesso liberado após a confirmação e criação da
              sua conta.
            </p>
          </div>
          <Link href="/checkout" className="button button-primary button-large">
            Quero começar agora <Icon name="arrowRight" size={18} />
          </Link>
        </section>
      </>
    );
  };

  const renderTravelerTestimonials = () => {
    const testimonial = travelerTestimonials[testimonialIndex];
    const selectTestimonial = (
      next: number,
      direction: "next" | "previous" = "next",
    ) => {
      if (testimonialTransitionLock.current) return;
      const nextIndex =
        (next + travelerTestimonials.length) % travelerTestimonials.length;
      if (nextIndex === testimonialIndex) return;
      testimonialTransitionLock.current = true;
      setTestimonialDirection(direction);
      setTestimonialIndex(nextIndex);
      setTestimonialAnimating(true);
    };
    const handleTestimonialTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
      const endX =
        event.changedTouches[0]?.clientX ?? testimonialTouchStart.current;
      const distance = endX - testimonialTouchStart.current;
      if (Math.abs(distance) < 46) return;
      selectTestimonial(
        testimonialIndex + (distance < 0 ? 1 : -1),
        distance < 0 ? "next" : "previous",
      );
    };

    return (
      <section
        className="traveler-testimonials home-reveal"
        aria-labelledby="traveler-testimonials-title"
      >
        <div className="traveler-testimonials-heading">
          <span className="small-label">RESULTADOS REAIS</span>
          <h2 id="traveler-testimonials-title">
            Veja o que os viajantes estão conquistando
          </h2>
          <p>
            Histórias de quem já começou a usar estratégias de milhas para
            transformar planos em novas viagens.
          </p>
        </div>
        <div className="traveler-testimonial-stage">
          <span className="traveler-testimonial-orbit" aria-hidden="true" />
          <div
            className={`traveler-testimonial-card ${
              testimonialAnimating ? `is-${testimonialDirection}` : ""
            }`}
            onAnimationEnd={(event) => {
              if (event.currentTarget !== event.target) return;
              testimonialTransitionLock.current = false;
              setTestimonialAnimating(false);
            }}
            onTouchStart={(event) => {
              testimonialTouchStart.current = event.touches[0]?.clientX ?? 0;
            }}
            onTouchEnd={handleTestimonialTouchEnd}
          >
            <div className="traveler-testimonial-card-top">
              <span>
                HISTÓRIA {String(testimonialIndex + 1).padStart(2, "0")} /{" "}
                {String(travelerTestimonials.length).padStart(2, "0")}
              </span>
              <span>resultado real</span>
            </div>
            <div className="traveler-testimonial-image">
              <img
                src={testimonial.image}
                alt={testimonial.alt}
                width={testimonial.width}
                height={testimonial.height}
              />
            </div>
          </div>
          <div
            className="traveler-testimonial-controls"
            aria-label="Navegação dos depoimentos"
          >
            <button
              type="button"
              className="traveler-carousel-arrow"
              onClick={() =>
                selectTestimonial(testimonialIndex - 1, "previous")
              }
              aria-label="Depoimento anterior"
            >
              <Icon name="arrowLeft" size={19} />
            </button>
            <div
              className="traveler-carousel-dots"
              role="tablist"
              aria-label="Escolher depoimento"
            >
              {travelerTestimonials.map((item, index) => (
                <button
                  type="button"
                  role="tab"
                  key={item.image}
                  aria-selected={index === testimonialIndex}
                  aria-label={`Mostrar depoimento ${index + 1}`}
                  className={index === testimonialIndex ? "active" : ""}
                  onClick={() =>
                    selectTestimonial(
                      index,
                      index >= testimonialIndex ? "next" : "previous",
                    )
                  }
                />
              ))}
            </div>
            <span className="traveler-carousel-count" aria-live="polite">
              <b>{String(testimonialIndex + 1).padStart(2, "0")}</b>
              <span>
                {" "}
                de {String(travelerTestimonials.length).padStart(2, "0")}
              </span>
            </span>
            <button
              type="button"
              className="traveler-carousel-arrow"
              onClick={() => selectTestimonial(testimonialIndex + 1, "next")}
              aria-label="Próximo depoimento"
            >
              <Icon name="arrowRight" size={19} />
            </button>
          </div>
          <p className="traveler-carousel-hint">
            Deslize para ver mais histórias
          </p>
        </div>
        <div className="home-guarantee card-surface">
          <span className="home-guarantee-icon">
            <Icon name="lock" size={23} />
          </span>
          <div>
            <span className="small-label">GARANTIA DE 7 DIAS</span>
            <h3>Entre com tranquilidade. Decida com confiança.</h3>
            <p>
              Você terá 7 dias após a compra para conhecer o curso. Se ele não
              fizer sentido para você, solicite o reembolso dentro desse prazo,
              sem burocracia.
            </p>
          </div>
          <Link href="/checkout" className="button button-primary">
            Quero conhecer o curso <Icon name="arrowRight" size={17} />
          </Link>
        </div>
      </section>
    );
  };

  const renderSecureAccess = () => (
    <div className="access-layout secure-access-layout">
      <section className="access-card card-surface">
        <div className="auth-tabs">
          <button
            className={authMode === "login" ? "active" : ""}
            onClick={() => setAuthMode("login")}
          >
            Entrar
          </button>
          <button
            className={authMode === "signup" ? "active" : ""}
            onClick={() => setAuthMode("signup")}
          >
            Criar conta
          </button>
        </div>
        <div className="auth-heading">
          <span className="auth-icon">
            <Icon name={authMode === "login" ? "lock" : "user"} size={19} />
          </span>
          <div>
            <h3>
              {authMode === "login"
                ? "Seu acesso está pronto"
                : "Crie seu acesso ao curso"}
            </h3>
            <p>
              {authMode === "login"
                ? "Entre com o mesmo e-mail usado na compra."
                : "Use o mesmo e-mail informado no checkout da Kiwify."}
            </p>
          </div>
        </div>
        <div className="access-verified-note">
          <Icon name="check" size={16} />
          <span>
            O acesso só é liberado quando a compra de {formatCurrency(50, language)} for confirmada.
          </span>
        </div>
        <label className="field-label">
          E-mail
          <input
            value={authEmail}
            onChange={(event) => setAuthEmail(event.target.value)}
            type="email"
            placeholder="voce@exemplo.com"
            autoComplete="email"
          />
        </label>
        <label className="field-label">
          Senha de acesso
          <div className="input-with-icon">
            <input
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
              type="password"
              placeholder="Crie uma senha segura"
              autoComplete={
                authMode === "login" ? "current-password" : "new-password"
              }
              minLength={8}
            />
            <Icon name="lock" size={16} />
          </div>
        </label>
        {authMode === "signup" && (
          <label className="guardian-authorization">
            <input
              checked={guardianAuthorizationConfirmed}
              onChange={(event) => setGuardianAuthorizationConfirmed(event.target.checked)}
              type="checkbox"
            />
            <span>
              Confirmo que tenho 18 anos ou que possuo autorização do meu responsável legal para criar uma conta ou realizar uma compra.
            </span>
          </label>
        )}
        <button
          className="button button-primary full-button"
          disabled={authBusy}
          onClick={handleAccountAccess}
        >
          {authBusy
            ? "Verificando…"
            : authMode === "login"
              ? "Entrar na plataforma"
              : "Criar minha conta"}
          <Icon name="arrowRight" size={17} />
        </button>
        <button
          className="forgot-button"
          disabled={authBusy}
          onClick={requestPasswordRecovery}
        >
          Esqueci minha senha
        </button>
        <div className="auth-divider" style={{ display: "flex" }}>
          <span>ou continue com</span>
        </div>
        <button
          className="social-button google-login-button"
          style={{ display: "flex" }}
          type="button"
          disabled={authBusy}
          onClick={handleGoogleAccess}
        >
          <span className="google-mark" aria-hidden="true">
            G
          </span>
          Continuar com Google
        </button>
      </section>
      <aside className="access-journey-card">
        <span className="small-label">SUA JORNADA</span>
        <h3>
          Compra confirmada.
          <br />
          <em>Curso liberado.</em>
        </h3>
        <ol>
          <li>
            <b>1</b>
            <span>Você conclui o pagamento protegido pela Kiwify.</span>
          </li>
          <li>
            <b>2</b>
            <span>
              Confirmamos a compra diretamente com o evento seguro da
              plataforma.
            </span>
          </li>
          <li>
            <b>3</b>
            <span>
              Seu painel, aulas, ferramentas, missões e perfil são liberados.
            </span>
          </li>
        </ol>
        <div>
          <Icon name="lock" size={15} /> Nenhum acesso é liberado apenas por um
          link de redirecionamento.
        </div>
      </aside>
    </div>
  );

  const renderPasswordReset = () => (
    <div className="password-reset-layout">
      <section className="password-reset-card card-surface">
        <span className="password-reset-icon">
          <Icon name="lock" size={22} />
        </span>
        <span className="small-label">RECUPERAÇÃO SEGURA</span>
        {passwordUpdated ? (
          <>
            <h2>Senha atualizada</h2>
            <p>
              Sua nova senha foi salva. Entre novamente para continuar sua
              jornada.
            </p>
            <Link
              className="button button-primary full-button"
              href="/cadastro?mode=login"
            >
              Entrar com a nova senha <Icon name="arrowRight" size={17} />
            </Link>
          </>
        ) : recoveryReady ? (
          <>
            <h2>Defina uma nova senha</h2>
            <p>Use uma senha exclusiva, com pelo menos 8 caracteres.</p>
            <label className="field-label">
              Nova senha
              <div className="input-with-icon">
                <input
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  type="password"
                  placeholder="Nova senha"
                  autoComplete="new-password"
                  minLength={8}
                />
                <Icon name="lock" size={16} />
              </div>
            </label>
            <label className="field-label">
              Confirmar nova senha
              <div className="input-with-icon">
                <input
                  value={newPasswordConfirmation}
                  onChange={(event) =>
                    setNewPasswordConfirmation(event.target.value)
                  }
                  type="password"
                  placeholder="Confirmar nova senha"
                  autoComplete="new-password"
                  minLength={8}
                />
                <Icon name="lock" size={16} />
              </div>
            </label>
            <button
              className="button button-primary full-button"
              disabled={authBusy}
              onClick={handlePasswordUpdate}
            >
              {authBusy ? "Atualizando…" : "Atualizar senha"}
              <Icon name="arrowRight" size={17} />
            </button>
          </>
        ) : (
          <>
            <h2>Recupere seu acesso</h2>
            <p>
              {recoveryChecked
                ? "Abra o link mais recente enviado ao seu e-mail para continuar."
                : "Verificando o link seguro…"}
            </p>
            <Link
              className="button button-outline full-button"
              href="/cadastro"
            >
              Voltar para entrar <Icon name="arrowRight" size={17} />
            </Link>
          </>
        )}
      </section>
    </div>
  );

  const renderAccess = () => (
    <div className="access-layout">
      <div className="access-card card-surface">
        <div className="auth-tabs">
          <button
            className={authMode === "login" ? "active" : ""}
            onClick={() => setAuthMode("login")}
          >
            Entrar
          </button>
          <button
            className={authMode === "signup" ? "active" : ""}
            onClick={() => setAuthMode("signup")}
          >
            Criar conta
          </button>
        </div>
        <div className="auth-heading">
          <span className="auth-icon">
            <Icon name={authMode === "login" ? "lock" : "user"} size={19} />
          </span>
          <div>
            <h3>
              {authMode === "login"
                ? "Bem-vindo de volta"
                : "Comece sua jornada"}
            </h3>
            <p>
              {authMode === "login"
                ? "Continue de onde você parou."
                : "Crie seu cadastro gratuito em poucos minutos."}
            </p>
          </div>
        </div>
        <label className="field-label">
          E-mail
          <input type="email" placeholder="E-mail" autoComplete="email" />
        </label>
        <label className="field-label">
          Senha de acesso
          <div className="input-with-icon">
            <input
              type="password"
              placeholder="Senha de acesso"
              autoComplete={
                authMode === "login" ? "current-password" : "new-password"
              }
            />
            <Icon name="lock" size={16} />
          </div>
        </label>
        <button
          className="button button-primary full-button"
          onClick={() => notify(siteNotice[language].account)}
        >
          {authMode === "login" ? "Entrar na plataforma" : "Criar minha conta"}
          <Icon name="arrowRight" size={17} />
        </button>
        <button
          className="forgot-button"
          onClick={() => notify(siteNotice[language].account)}
        >
          Esqueci minha senha
        </button>
        <div className="auth-divider">
          <span>ou continue com</span>
        </div>
        <button
          className="social-button"
          onClick={() => notify(siteNotice[language].account)}
        >
          <span className="google-mark">G</span> Continuar com Google
        </button>
      </div>
      <div className="payment-column">
        <div className="site-status-note">
          <Icon name="info" size={17} />
          <p>{siteNotice[language].account}</p>
        </div>
        <div className="payment-intro">
          <div className="section-kicker">
            <Icon name="lock" size={15} /> ACESSO AO CURSO COMPLETO
          </div>
          <h3>Invista no seu próximo destino.</h3>
          <p>{siteNotice[language].payment}</p>
          <div className="price-placeholder">
            <span>Valor do acesso</span>
            <strong>
              {currencyByLanguage[language].currency} [VALOR
              <br className="desktop-only" /> NÃO ATRIBUÍDO]
            </strong>
          </div>
        </div>
        <div className="payment-methods">
          <div className="payment-title">
            <span>Formas de pagamento</span>
            <small>via Mercado Pago</small>
          </div>
          <button
            className={`payment-option pix-option ${paymentMethod === "pix" ? "selected" : ""}`}
            onClick={() => setPaymentMethod("pix")}
          >
            <span className="payment-symbol pix-symbol">
              <Icon name="pix" size={20} />
            </span>
            <span>
              <b>
                PIX <em>recomendado</em>
              </b>
              <small>Aprovação imediata • acesso na hora</small>
            </span>
            <span className="radio-dot" />
          </button>
          <button
            className={`payment-option ${paymentMethod === "card" ? "selected" : ""}`}
            onClick={() => setPaymentMethod("card")}
          >
            <span className="payment-symbol">
              <Icon name="creditCard" size={20} />
            </span>
            <span>
              <b>Cartão de crédito</b>
              <small>Todos os países • até 24h</small>
            </span>
            <span className="radio-dot" />
          </button>
        </div>
        <div className="payment-note">
          <Icon name="info" size={15} />
          <span>
            <b>Para usuários internacionais:</b> o Pix está disponível apenas no
            Brasil. Use cartão de crédito.
          </span>
        </div>
        <div className="color-legend">
          <span className="legend-label">Legenda</span>
          <span>
            <i className="legend-color yellow-dot" /> Mais fácil e rápido
          </span>
          <span>
            <i className="legend-color gray-dot" /> Disponível com limitações
          </span>
        </div>
      </div>
    </div>
  );

  const handleCheckout = () => {
    if (!canContinueWithGuardianAuthorization(guardianAuthorizationConfirmed)) {
      notify(
        translateVisibleValue(
          "Para continuar, confirme que tem 18 anos ou a autorização do seu responsável legal.",
          language,
        ),
      );
      return;
    }
    window.location.assign("/api/checkout");
  };

  const renderCheckout = () => (
    <div className="checkout-layout">
      <section className="checkout-card card-surface">
        <div className="checkout-brand">
          <span className="brand-mark">
            <Icon name="plane" size={17} />
          </span>
          <span>
            <b>{brand.tagline.split(" ").slice(0, -1).join(" ") || brand.tagline}</b>
            <em>{brand.tagline.split(" ").slice(-1)[0]}</em>
          </span>
        </div>
        <span className="small-label">CHECKOUT SEGURO</span>
        <h2>Seu acesso começa com uma compra segura.</h2>
        <p>Você será direcionado à Kiwify para concluir o pagamento.</p>
        <div className="checkout-summary">
          <span>
            <Icon name="book" size={19} />
          </span>
          <div>
            <b>{brand.tagline}</b>
            <small>Aulas, ferramentas e materiais do curso</small>
          </div>
        </div>
        <label className="guardian-authorization">
          <input
            checked={guardianAuthorizationConfirmed}
            onChange={(event) => setGuardianAuthorizationConfirmed(event.target.checked)}
            type="checkbox"
          />
          <span>
            Confirmo que tenho 18 anos ou que possuo autorização do meu responsável legal para criar uma conta ou realizar uma compra.
          </span>
        </label>
        <button
          className="button button-primary full-button"
          onClick={handleCheckout}
        >
          Prosseguir para pagamento <Icon name="arrowRight" size={17} />
        </button>
        <p className="checkout-security">
          <Icon name="lock" size={15} /> Pagamento protegido pela Kiwify
        </p>
      </section>
      <aside className="checkout-steps">
        <span className="small-label">COMO FUNCIONA</span>
        <ol>
          <li>
            <b>1</b>
            <span>Conclua a compra no checkout da Kiwify.</span>
          </li>
          <li>
            <b>2</b>
            <span>
              Após a confirmação do pagamento, crie sua conta para acessar as
              aulas.
            </span>
          </li>
          <li>
            <b>3</b>
            <span>Comece pela primeira aula do curso.</span>
          </li>
        </ol>
        <div className="checkout-note">
          <Icon name="info" size={16} />
          <span>Seu pagamento será confirmado antes da criação da conta.</span>
        </div>
      </aside>
    </div>
  );

  const renderPaymentStatus = () => {
    // This preview flag is removed by Next.js from production builds. It lets us
    // review the signed-in state locally without faking a real user session.
    const previewGranted =
      process.env.NODE_ENV !== "production" &&
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("preview") === "granted";
    const displayName = previewGranted
      ? "Kevin"
      : profileName === "Entrar"
        ? "você"
        : profileName;

    if (
      previewGranted ||
      (authenticatedUser && courseAccessStatus === "granted")
    ) {
      return (
        <div className="payment-status-layout card-surface payment-status-approved">
          <span className="payment-status-icon">
            <Icon name="check" size={28} />
          </span>
          <span className="small-label">ACESSO LIBERADO</span>
          <h3>
            Seu curso já está
            <br />
            <em>pronto para você.</em>
          </h3>
          <p>
            Olá, {displayName}. Identificamos sua conta e a confirmação do
            pagamento. Você pode continuar exatamente de onde parou.
          </p>
          <div className="payment-status-steps payment-status-steps-approved">
            <span>
              <b>
                <Icon name="check" size={14} />
              </b>{" "}
              Compra confirmada
            </span>
            <span>
              <b>
                <Icon name="check" size={14} />
              </b>{" "}
              Conta reconhecida
            </span>
            <span>
              <b>
                <Icon name="check" size={14} />
              </b>{" "}
              Curso liberado
            </span>
          </div>
          <div className="payment-status-actions">
            <Link href="/curso" className="button button-primary">
              Continuar para o curso <Icon name="arrowRight" size={17} />
            </Link>
            <Link href="/" className="button button-outline">
              Ir para o site
            </Link>
          </div>
          <small>
            Seu acesso permanece vinculado à sua conta. Não é preciso criar um
            novo cadastro.
          </small>
        </div>
      );
    }

    if (authenticatedUser) {
      const unavailable = courseAccessStatus === "unavailable";
      return (
        <div className="payment-status-layout card-surface">
          <span className="payment-status-icon">
            <Icon name="check" size={28} />
          </span>
          <span className="small-label">CONTA RECONHECIDA</span>
          <h3>
            {courseAccessStatus === "checking" ? (
              <>
                Verificando seu
                <br />
                <em>acesso ao curso.</em>
              </>
            ) : (
              <>
                Seu acesso está
                <br />
                <em>em confirmação.</em>
              </>
            )}
          </h3>
          <p>
            {unavailable
              ? "Não foi possível confirmar o pagamento neste instante. Sua conta está salva; tente verificar novamente em alguns segundos."
              : "Sua conta já está cadastrada. Assim que a confirmação segura da Kiwify for encontrada, o curso será liberado automaticamente."}
          </p>
          <div className="payment-status-steps">
            <span>
              <b>1</b> Conta reconhecida
            </span>
            <span>
              <b>2</b> Confirmação segura
            </span>
            <span>
              <b>3</b> Curso liberado
            </span>
          </div>
          <div className="payment-status-actions">
            <button
              className="button button-primary"
              type="button"
              disabled={courseAccessStatus === "checking"}
              onClick={() => void refreshCourseAccess()}
            >
              {courseAccessStatus === "checking"
                ? "Verificando…"
                : "Verificar meu acesso"}
              <Icon name="arrowRight" size={17} />
            </button>
            <Link href="/" className="button button-outline">
              Ir para o site
            </Link>
          </div>
          <small>
            Usamos a mesma conta e o mesmo e-mail informados no pagamento.
          </small>
        </div>
      );
    }

    return (
      <div className="payment-status-layout card-surface">
        <span className="payment-status-icon">
          <Icon name="check" size={28} />
        </span>
        <span className="small-label">CONFIRMAÇÃO DE ACESSO</span>
        <h3>
          Estamos verificando
          <br />
          <em>seu pagamento.</em>
        </h3>
        <p>
          Assim que a Kiwify confirmar a compra, seu acesso completo será
          associado ao e-mail usado no checkout.
        </p>
        <div className="payment-status-steps">
          <span>
            <b>1</b> Compra concluída
          </span>
          <span>
            <b>2</b> Confirmação segura
          </span>
          <span>
            <b>3</b> Curso liberado
          </span>
        </div>
        <Link href="/cadastro" className="button button-primary">
          Criar ou acessar minha conta <Icon name="arrowRight" size={17} />
        </Link>
        <small>Use exatamente o mesmo e-mail informado no pagamento.</small>
      </div>
    );
  };

  const renderWelcome = () => (
    <div className="welcome-layout">
      <div className="welcome-copy">
        <div className="welcome-overline">
          <span className="avatar avatar-large">JS</span>
          <span>PRIMEIRO ACESSO</span>
        </div>
        <h3>
          Olá, João!{" "}
          <span className="greeting-mark">
            <Icon name="spark" size={15} />
          </span>
        </h3>
        <p>
          Sua jornada no mundo das milhas começa agora. Preparamos um primeiro
          passo simples para você sentir a evolução.
        </p>
        <button className="button button-primary" onClick={() => goTo(6)}>
          Começar curso <Icon name="arrowRight" size={17} />
        </button>
        <div className="welcome-stats">
          <div>
            <strong>9</strong>
            <span>Módulos</span>
          </div>
          <div>
            <strong>36</strong>
            <span>Aulas</span>
          </div>
          <div>
            <strong>10</strong>
            <span>Conquistas</span>
          </div>
        </div>
      </div>
      <div className="welcome-card card-surface">
        <div className="welcome-card-top">
          <span>SEU PONTO DE PARTIDA</span>
          <span className="status-pill">EM ANDAMENTO</span>
        </div>
        <div className="level-display">
          <div className="level-ring">
            <div>
              <strong>1</strong>
              <small>nível</small>
            </div>
          </div>
          <div>
            <span className="small-label">NÍVEL ATUAL</span>
            <h4>Iniciante</h4>
            <p>0 / 100 XP para o próximo nível</p>
          </div>
        </div>
        <ProgressBar value={0} />
        <div className="first-mission">
          <span className="mission-icon">
            <Icon name="target" size={21} />
          </span>
          <div>
            <span className="small-label">SUA PRIMEIRA MISSÃO</span>
            <strong>Assista à primeira aula do módulo 1</strong>
            <span className="mission-reward">
              <Icon name="spark" size={13} /> +50 XP
            </span>
          </div>
          <span className="mission-arrow">
            <Icon name="arrowRight" size={17} />
          </span>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="dashboard-layout">
      <div className="dashboard-greeting">
        <div>
          <span className="small-label">QUARTA-FEIRA, 18 SET 2026</span>
          <h3>
            Bom dia, João{" "}
            <span className="greeting-mark">
              <Icon name="spark" size={15} />
            </span>
          </h3>
        </div>
        <button className="button button-outline" onClick={() => goTo(5)}>
          <Icon name="book" size={16} /> Ver mapa do curso
        </button>
      </div>
      <div className="dashboard-stats">
        <div className="stat-card highlight">
          <span className="stat-icon">
            <Icon name="chart" size={19} />
          </span>
          <div>
            <small>PROGRESSO DO CURSO</small>
            <strong>67%</strong>
            <ProgressBar value={67} />
          </div>
          <span className="stat-trend">+12%</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon blue-icon">
            <Icon name="spark" size={18} />
          </span>
          <div>
            <small>XP TOTAL</small>
            <strong>
              250 <em>/ 500</em>
            </strong>
            <span className="stat-caption">Nível 3 • Intermediário</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon purple-icon">
            <Icon name="trophy" size={18} />
          </span>
          <div>
            <small>CONQUISTAS</small>
            <strong>
              4 <em>/ 10</em>
            </strong>
            <span className="stat-caption">+1 nesta semana</span>
          </div>
        </div>
      </div>
      <div className="dashboard-columns">
        <div className="next-lesson card-surface">
          <div className="card-heading">
            <span>
              <Icon name="play" size={13} /> PRÓXIMA AULA
            </span>
            <button className="round-more">•••</button>
          </div>
          <div className="lesson-visual">
            <div className="lesson-gradient">
              <span className="lesson-play">
                <Icon name="play" size={16} />
              </span>
              <span className="lesson-duration">
                <Icon name="clock" size={12} /> 15 min
              </span>
            </div>
            <div className="lesson-info">
              <span className="module-tag">MÓDULO 02</span>
              <h4>Como funcionam os programas Smiles e TudoAzul</h4>
              <p>
                Entenda os diferenciais e escolha onde concentrar seus pontos.
              </p>
              <div className="lesson-footer">
                <span>
                  <Icon name="play" size={12} /> Vídeo-aula
                </span>
                <button
                  className="button button-primary button-small"
                  onClick={() => goTo(6)}
                >
                  Continuar <Icon name="arrowRight" size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="dashboard-side">
          <div className="side-heading">
            <h4>Missões da semana</h4>
            <button className="link-button" onClick={() => goTo(9)}>
              Ver todas
            </button>
          </div>
          <div className="mini-mission">
            <span className="check-circle done">
              <Icon name="check" size={13} />
            </span>
            <span>Complete seu perfil</span>
            <b>+20 XP</b>
          </div>
          <div className="mini-mission">
            <span className="check-circle done">
              <Icon name="check" size={13} />
            </span>
            <span>Veja a aula 01</span>
            <b>+50 XP</b>
          </div>
          <div className="mini-mission">
            <span className="check-circle">
              <Icon name="target" size={13} />
            </span>
            <span>Faça o quiz do módulo 01</span>
            <b>+80 XP</b>
          </div>
          <div className="dashboard-banner">
            <div>
              <span>ACELERE SEU PROGRESSO</span>
              <strong>
                Uma missão por dia.
                <br />
                Uma viagem mais perto.
              </strong>
            </div>
            <Icon name="zap" size={28} />
          </div>
        </div>
      </div>
      <div className="achievement-strip">
        <div className="side-heading">
          <h4>Conquistas recentes</h4>
          <button className="link-button" onClick={() => goTo(12)}>
            Ver todas
          </button>
        </div>
        <div className="achievement-row">
          <div className="achievement-item unlocked">
            <span>
              <Icon name="play" size={18} />
            </span>
            <small>Primeira aula</small>
          </div>
          <div className="achievement-item unlocked">
            <span>
              <Icon name="book" size={18} />
            </span>
            <small>Primeiro módulo</small>
          </div>
          <div className="achievement-item unlocked">
            <span>
              <Icon name="spark" size={18} />
            </span>
            <small>100% foco</small>
          </div>
          <div className="achievement-item locked">
            <span>
              <Icon name="lock" size={17} />
            </span>
            <small>Caçador de bônus</small>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCourseMap = () => {
    const missionCopy = courseMissionCopy[language] ?? courseMissionCopy["pt-BR"];
    const localizedModules = modules.map((module, index) => ({
      ...module,
      title: missionCopy.moduleTitles[index] ?? module.title,
      meta: missionCopy.moduleMeta[index] ?? module.meta,
    }));
    return <div className="course-layout">
      <div className="course-progress-card">
        <div>
          <span className="small-label">{missionCopy.learningTrail}</span>
          <h3>{missionCopy.trailHeadline}</h3>
          <p>{missionCopy.trailDescription}</p>
        </div>
        <div className="course-progress-number">
          <strong>2</strong>
          <span>/ 3 {missionCopy.modules}</span>
        </div>
        <div className="course-bar">
          <ProgressBar value={67} />
          <span>{translateVisibleValue("67% da trilha disponível ·", language)} {earnedXp} XP</span>
        </div>
      </div>
      <div className="course-filter">
        <span className="small-label">{missionCopy.courseMap}</span>
        <div>
          <button className="filter-button active">
            {missionCopy.allModules} <b>3</b>
          </button>
          <button className="filter-button">
            {missionCopy.completedModules} <b>1</b>
          </button>
          <button className="filter-button">
            {missionCopy.moduleInProgress} <b>1</b>
          </button>
        </div>
      </div>
      <div className="module-list">
        {localizedModules.map((module) => (
          <button
            key={module.number}
            className={`module-row ${module.state}`}
            onClick={() => goTo(6)}
          >
            <span className={`module-number ${module.state}`}>
              <span>
                {module.state === "done" ? (
                  <Icon name="check" size={18} />
                ) : (
                  module.number
                )}
              </span>
            </span>
            <span className={`module-icon ${module.state}`}>
              <Icon name={module.icon} size={19} />
            </span>
            <span className="module-info">
              <b>{module.title}</b>
              <small>{module.meta}</small>
            </span>
            <span className="module-status">
              {module.state === "done" ? (
                <>
                  <Icon name="check" size={14} /> {missionCopy.completed}
                </>
              ) : module.state === "current" ? (
                <>
                  <span className="status-live" /> {missionCopy.moduleInProgress}
                </>
              ) : (
                missionCopy.availableModules
              )}
            </span>
            <Icon name="arrowRight" size={17} />
          </button>
        ))}
      </div>
      <section className="course-coming-soon">
        <span className="small-label">PRÓXIMAS AULAS</span>
        <h4>Aulas a definir</h4>
        <p>
          Novos conteúdos estão sendo preparados para a próxima etapa da sua
          jornada.
        </p>
        <div>
          <span>Aula a definir</span>
          <span>Aula a definir</span>
          <span>Aula a definir</span>
        </div>
      </section>
      <div className="course-tip">
        <Icon name="spark" size={18} />
        <span>
          <b>Dica de especialista:</b> não tenha pressa. A consistência vale
          mais que a velocidade.
        </span>
      </div>
    </div>;
  };

  const renderLessonMaterials = () => (
    <div className="lesson-materials">
      <div className="module-overview card-surface">
        <div className="module-overview-heading">
          <div>
            <span className="small-label">CONTEÚDO DA AULA 01</span>
            <h4>Fundamentos das milhas</h4>
            <p>
              Diferencie pontos e milhas, entenda o que é um milheiro e
              conheça os programas de fidelidade das companhias aéreas.
            </p>
          </div>
          <span className="module-completion">
            <b>20%</b>
            <small>do módulo</small>
          </span>
        </div>
        <div className="module-objectives">
          <span className="small-label">OBJETIVOS DESTA AULA</span>
          <div>
            <span>01</span>
            <p>Diferenciar pontos, que vêm de bancos e parceiros, de milhas.</p>
          </div>
          <div>
            <span>02</span>
            <p>Entender que um milheiro corresponde a 1.000 milhas.</p>
          </div>
          <div>
            <span>03</span>
            <p>Reconhecer programas como Smiles e TudoAzul e fazer o cadastro gratuito.</p>
          </div>
        </div>
      </div>
      <div className="pedagogy-card card-surface">
        <div className="pedagogy-heading">
          <div>
            <span className="small-label">MODELO PEDAGÓGICO</span>
            <h4>Uma aula em oito movimentos.</h4>
          </div>
          <span className="pedagogy-caption">Entender · reconhecer · revisar</span>
        </div>
        <div className="pedagogy-steps">
          <span className="is-active">
            01 <b>Visão geral</b>
          </span>
          <span>
            02 <b>Pontos e milhas</b>
          </span>
          <span>
            03 <b>Programas de fidelidade</b>
          </span>
          <span>
            04 <b>O milheiro</b>
          </span>
          <span>
            05 <b>Exemplos de programas</b>
          </span>
          <span>
            06 <b>Cadastro gratuito</b>
          </span>
          <span>
            07 <b>Revisão dos materiais</b>
          </span>
          <span>
            08 <b>Questões da Aula 01</b>
          </span>
        </div>
      </div>
      <div className="lesson-actions">
        <button className="button button-outline" onClick={() => goTo(5)}>
          <Icon name="arrowLeft" size={15} /> Voltar
        </button>
        <span>
          <Icon name="check" size={15} /> Progresso salvo automaticamente
        </span>
        <button
          className="button button-primary"
          onClick={() => {
            notify("Aula marcada como concluída");
            goTo(5);
          }}
        >
          Próxima aula <Icon name="arrowRight" size={15} />
        </button>
      </div>
      <CoverflowDocuments
        items={lesson01Documents}
        title="Documentos de viagem"
        description="Materiais da Aula 01 para consultar durante o aprendizado."
        translate={(value) => translateVisibleValue(value, language)}
      />
      <section className="translated-pdfs" aria-label="PDFs traduzidos">
        <div>
          <span>LEITURA NO SEU IDIOMA</span>
          <h3>PDFs traduzidos</h3>
          <p>Abra a versão de estudo no idioma selecionado no site.</p>
        </div>
        <div className="translated-pdf-links">
          <Link href="/material/o-que-sao-milhas">O que são milhas <Icon name="arrowRight" size={15} /></Link>
          <Link href="/material/programas-de-fidelidade">Programas de fidelidade <Icon name="arrowRight" size={15} /></Link>
        </div>
      </section>
    </div>
  );

  const renderLessonReview = () => {
    const mode = lessonQuestionMode;
    const questionUi = lessonQuestionUi[language] ?? {
      reviewLabel: "REVISÃO DA AULA 01",
      challengeLabel: "QUESTÕES DESAFIO",
      reviewTab: "Questões de revisão",
      challengeTab: "Questões Desafio",
      title: "Antes de concluir, mostre o que aprendeu.",
      reviewHint: "Cada acerto rende 5 XP. Depois da escolha, a questão fica travada por 24 horas.",
      challengeHint: "Você receberá mais XP ao concluir estas questões.",
      challengeXp: "Você receberá 10 XP por cada resposta certa nestas questões.",
      correct: "Resposta certa.",
      correctReveal: "A resposta correta está destacada.",
      summary: "Resumo da rodada:",
      answers: "respondidas",
      perCorrect: "XP por acerto",
      confirm: "Confirmar",
      goToMap: "Ir para o mapa",
      incomplete: "Responda todas as questões antes de confirmar.",
    };
    const questions =
      mode === "review" ? lesson01ReviewQuestions : lesson01ChallengeQuestions;
    const xpPerCorrect = mode === "review" ? 5 : 10;
    const attempts = questions.map((question) => ({
      question,
      attempt: getLessonQuestionAttempt(question.id),
    }));
    const answeredCount = attempts.filter(({ attempt }) => attempt).length;
    const finishLesson = () => {
      if (answeredCount !== questions.length) {
        notify(`${questionUi.incomplete}`);
        return;
      }
      const correct = attempts.filter(
        ({ question, attempt }) =>
          attempt?.selectedIndex === question.correctIndex,
      ).length;
      const xp = attempts.reduce(
        (total, { attempt }) => total + (attempt?.xpAwarded ?? 0),
        0,
      );
      setLessonSummary({
        mode,
        correct,
        wrong: questions.length - correct,
        xp,
      });
      window.setTimeout(() => goTo(5), 2800);
    };
    return (
      <section
        className="quiz-card card-surface lesson-review"
        style={{ marginTop: 20 }}
      >
        <div className="quiz-content">
          <span className="question-type">
            <Icon name="target" size={14} />{" "}
            {mode === "review" ? questionUi.reviewLabel : questionUi.challengeLabel}
          </span>
          <div className="tool-tabs lesson-review-tabs">
            <button
              className={mode === "review" ? "active" : ""}
              onClick={() => {
                setLessonQuestionMode("review");
                setLessonSummary(null);
              }}
            >
              {questionUi.reviewTab}
            </button>
            <button
              className={mode === "challenge" ? "active" : ""}
              onClick={() => {
                setLessonQuestionMode("challenge");
                setLessonSummary(null);
              }}
            >
              {questionUi.challengeTab}
            </button>
          </div>
          <h3>{questionUi.title}</h3>
          <p>
            {mode === "review"
              ? questionUi.reviewHint
              : questionUi.challengeHint}
          </p>
          {mode === "challenge" && (
            <div className="quiz-feedback correct">
              <Icon name="spark" size={15} />
              <span>
                {questionUi.challengeXp}
              </span>
            </div>
          )}
          {attempts.map(({ question, attempt }, questionIndex) => {
            const translatedQuestion =
              language === "pt-BR" || language === "pt-PT"
                ? question
                : lesson01QuestionTranslations[language]?.[question.id] ??
                  question;
            const localizedQuestion = {
              ...translatedQuestion,
              prompt: localizeCurrencyText(translatedQuestion.prompt, language),
              options: translatedQuestion.options.map((option) =>
                localizeCurrencyText(option, language),
              ),
              explanation: localizeCurrencyText(
                translatedQuestion.explanation,
                language,
              ),
            };
            const locked = Boolean(attempt);
            return (
              <div
                className="quiz-options"
                key={question.id}
                style={{ marginTop: 24 }}
              >
              <b>
                {questionIndex + 1}. {localizedQuestion.prompt}
              </b>
                {localizedQuestion.options.map((option, optionIndex) => {
                  const isCorrect = optionIndex === question.correctIndex;
                  const selected = attempt?.selectedIndex === optionIndex;
                  const state = locked
                    ? isCorrect
                      ? "correct revealed-correct"
                      : selected
                        ? "wrong"
                        : ""
                    : "";
                  return (
                    <button
                      key={option}
                      disabled={locked || !lessonQuizLoaded}
                      className={`quiz-option ${state}`}
                      onClick={() =>
                        answerLessonQuestion(question, optionIndex, mode)
                      }
                    >
                      <span className="option-letter">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span>{option}</span>
                      {locked && (isCorrect || selected) && (
                        <Icon name={isCorrect ? "check" : "close"} size={17} />
                      )}
                    </button>
                  );
                })}
                {locked && (
                  <div
                    className={`quiz-feedback ${attempt?.selectedIndex === question.correctIndex ? "correct" : "wrong"}`}
                  >
                    <Icon
                      name={
                        attempt?.selectedIndex === question.correctIndex
                          ? "check"
                          : "info"
                      }
                      size={15}
                    />
                    <span>
                      {attempt?.selectedIndex === question.correctIndex ? (
                        <>
                          <b>{questionUi.correct}</b> +{attempt?.xpAwarded ?? 0} XP.
                        </>
                      ) : (
                        <>
                          {localizedQuestion.explanation}{" "}
                          <b>{questionUi.correctReveal}</b>
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
          {lessonSummary?.mode === mode && (
            <div className="quiz-feedback correct lesson-review-summary">
              <Icon name="check" size={16} />
              <span>
                <b>{questionUi.summary}</b> {lessonSummary.correct} / {questions.length} · {lessonSummary.xp} XP
              </span>
            </div>
          )}
          <div className="quiz-actions">
            <span className="tool-note">
              {answeredCount} / {questions.length} respondidas · {xpPerCorrect}{" "}
              {questionUi.perCorrect}
            </span>
            <button className="button button-primary" onClick={finishLesson}>
              {lessonSummary?.mode === mode ? questionUi.goToMap : questionUi.confirm}{" "}
              <Icon name="check" size={16} />
            </button>
          </div>
        </div>
      </section>
    );
  };

  const renderLesson = () => (
    <div className="lesson-layout">
      <div className="lesson-main">
        <div className="lesson-breadcrumb">
          <button onClick={() => goTo(5)}>Curso</button>
          <Icon name="arrowRight" size={13} />
          <span>Módulo 01</span>
          <Icon name="arrowRight" size={13} />
          <span>Aula 01</span>
        </div>
        <div className="video-player">
          <div className="video-grid-lines" />
          <div className="video-center">
            <span className="video-logo">
              <Icon name="plane" size={23} />
            </span>
            <span className="video-module">{translateVisibleValue("MÓDULO 01 · AULA 01", language)}</span>
            <h3>Fundamentos das milhas</h3>
            <button
              className="video-play"
              aria-label="Reproduzir aula"
              onClick={() => notify(siteNotice[language].video)}
            >
              <Icon name="play" size={21} />
            </button>
            <span className="video-time">
              03:42 <i /> 15:08
            </span>
          </div>
          <div className="video-controls">
            <Icon name="play" size={15} />
            <span className="video-progress">
              <i />
            </span>
            <Icon name="settings" size={15} />
            <span>1x</span>
            <Icon name="external" size={15} />
          </div>
        </div>
        <div className="lesson-content">
          <div>
            <span className="module-tag">{translateVisibleValue("MÓDULO 01", language)}</span>
            <h3>Entenda como as milhas funcionam</h3>
            <p>
              Comece pela base: pontos, programas de fidelidade e como
              transformar gastos do dia a dia em possibilidades de viagem.
            </p>
          </div>
          <span className="lesson-note">
            <Icon name="target" size={15} /> Conclusão liberada após a revisão
          </span>
        </div>
        {renderLessonMaterials()}
        {renderLessonReview()}
      </div>
      <aside className="lesson-sidebar card-surface">
        <div className="sidebar-title">
          <span>CONTEÚDO DA AULA</span>
          <b>1 / 5</b>
        </div>
        <ProgressBar value={20} />
        <div className="lesson-list">
          <button className="lesson-list-item current">
            <span>
              <Icon name="play" size={12} />
            </span>
            <div>
              <b>Fundamentos das milhas</b>
              <small>Em andamento • 15:08</small>
            </div>
          </button>
          <button className="lesson-list-item">
            <span>2</span>
            <div>
              <b>O que são programas?</b>
              <small>Próxima aula • 04:20</small>
            </div>
          </button>
          <button className="lesson-list-item">
            <span>3</span>
            <div>
              <b>Cartões que pontuam</b>
              <small>Próxima aula • 08:45</small>
            </div>
          </button>
          <button className="lesson-list-item">
            <span>4</span>
            <div>
              <b>Como acumular</b>
              <small>Próxima aula • 12:30</small>
            </div>
          </button>
          <button className="lesson-list-item">
            <span>5</span>
            <div>
              <b>Resumo do módulo</b>
              <small>Quiz • 05 questões</small>
            </div>
          </button>
        </div>
        <div className="lesson-outline">
          <span className="small-label">TEMAS E MATERIAIS</span>
          <div>
            <b>Fundamentos das milhas</b>
            <small>O que você vai aprender</small>
          </div>
          <div>
            <b>Como os pontos funcionam</b>
            <small>Entenda · Exemplo · Como fazer</small>
          </div>
          <div>
            <b>Teste seu conhecimento</b>
            <small>Exercício e quiz do módulo</small>
          </div>
          <div>
            <b>Desafio aplicado</b>
            <small>Material complementar · Arquivos a definir</small>
          </div>
        </div>
        <div className="lesson-note">
          <Icon name="info" size={15} />
          <span>
            Você pode voltar aqui quando quiser. Seu progresso fica salvo.
          </span>
        </div>
      </aside>
    </div>
  );

  const renderSimulator = () => (
    <div className="simulator-layout">
      <div className="tool-tabs">
        <button className="active">
          <Icon name="calculator" size={17} /> Simulador
        </button>
        <button onClick={() => goTo(8)}>
          <Icon name="chart" size={17} /> Comparador
        </button>
        <span className="tool-separator" />
        <span className="tool-note">
          <Icon name="lock" size={13} /> Dados demonstrativos
        </span>
      </div>
      <div className="simulator-grid">
        <div className="simulator-form card-surface">
          <div className="tool-card-title">
            <span className="tool-title-icon">
              <Icon name="calculator" size={20} />
            </span>
            <div>
              <span className="small-label">SIMULADOR DE ACÚMULO</span>
              <h3>Quanto você pode acumular?</h3>
            </div>
          </div>
          <p className="tool-intro">
            Ajuste os valores e veja uma estimativa de pontos para o seu perfil.
          </p>
          <label className="range-label">
            <span>Gastos mensais no cartão</span>
            <strong>{formatCurrency(simulatorSpend, language)}</strong>
          </label>
          <input
            className="range-input"
            type="range"
            min="500"
            max="12000"
            step="100"
            value={simulatorSpend}
            onChange={(event) => setSimulatorSpend(Number(event.target.value))}
          />
          <div className="range-limits">
            <span>{formatCurrency(500, language)}</span>
            <span>{formatCurrency(12000, language)}</span>
          </div>
          <label className="field-label select-label">
            Multiplicador médio
            <select
              value={simulatorMultiplier}
              onChange={(event) =>
                setSimulatorMultiplier(Number(event.target.value))
              }
            >
              <option value={1}>1 ponto / {formatCurrency(1, language)}</option>
              <option value={1.5}>
                1,5 ponto / {formatCurrency(1, language)}
              </option>
              <option value={2.2}>
                2,2 pontos / {formatCurrency(1, language)}
              </option>
              <option value={3}>
                3 pontos / {formatCurrency(1, language)}
              </option>
            </select>
            <Icon name="chevronDown" size={15} />
          </label>
          <div className="simulator-tip">
            <Icon name="spark" size={15} />
            <span>
              Inclua compras bonificadas para uma projeção ainda melhor.
            </span>
          </div>
          <button
            className="button button-primary full-button"
            onClick={() => void completeMission("simulator_used")}
          >
            Salvar projeção <Icon name="check" size={16} />
          </button>
        </div>
        <div className="simulator-result">
          <div className="result-pattern" />
          <div className="result-top">
            <span className="small-label">SUA PROJEÇÃO EM 12 MESES</span>
            <span className="result-pill">
              <Icon name="spark" size={13} /> +12% potencial
            </span>
          </div>
          <div className="result-number">
            <strong>
              {(simulatorPoints * 12).toLocaleString(
                currencyByLanguage[language].locale,
              )}
            </strong>
            <span>pontos</span>
          </div>
          <p>
            Com esse ritmo, você pode chegar mais perto de uma passagem de ida e
            volta para <b>Buenos Aires</b>.
          </p>
          <div className="result-divider" />
          <div className="result-detail">
            <span>
              <small>Por mês</small>
              <b>
                {simulatorPoints.toLocaleString(
                  currencyByLanguage[language].locale,
                )}{" "}
                pts
              </b>
            </span>
            <span>
              <small>Valor estimado</small>
              <b>
                {formatCurrency(((simulatorPoints * 12) / 1000) * 18, language)}
              </b>
            </span>
            <span>
              <small>Equivale a</small>
              <b>1 viagem</b>
            </span>
          </div>
          <div className="result-cta">
            <Icon name="plane" size={18} />
            <span>Quer aprender a multiplicar esse resultado?</span>
            <button onClick={() => goTo(9)}>
              <Icon name="arrowRight" size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderComparator = () => (
    <div className="comparator-layout">
      <div className="comparator-toolbar">
        <div className="tool-tabs">
          <button onClick={() => goTo(7)}>
            <Icon name="calculator" size={17} /> Simulador
          </button>
          <button className="active">
            <Icon name="chart" size={17} /> Comparador
          </button>
        </div>
        <div className="search-box">
          <Icon name="search" size={16} />
          <input placeholder="Buscar programa" />
          <span>⌘ K</span>
        </div>
      </div>
      <div className="compare-hero">
        <div>
          <span className="small-label">COMPARADOR DE PROGRAMAS</span>
          <h3>Qual programa combina com você?</h3>
          <p>Compare os pontos fortes e escolha com mais segurança.</p>
        </div>
        <div className="compare-filter">
          <span>Seu objetivo</span>
          <button>
            Viajar para fora <Icon name="chevronDown" size={14} />
          </button>
        </div>
      </div>
      <div className="compare-table card-surface">
        <div className="compare-table-head">
          <span>PROGRAMAS</span>
          <span>ACÚMULO</span>
          <span>RESGATE</span>
          <span>BENEFÍCIOS</span>
          <span />
        </div>
        {[
          {
            name: "Livelo",
            sub: "Banco + parceiros",
            icon: "L",
            color: "orange",
            accumulation: "Alta",
            redemption: "Muito alta",
            benefits: "Flexíveis",
            tag: "Mais completo",
          },
          {
            name: "Smiles",
            sub: "GOL Linhas Aéreas",
            icon: "S",
            color: "blue",
            accumulation: "Muito alta",
            redemption: "Alta",
            benefits: "Clubes",
            tag: "Melhor para voar",
          },
          {
            name: "TudoAzul",
            sub: "Azul Linhas Aéreas",
            icon: "A",
            color: "cyan",
            accumulation: "Alta",
            redemption: "Alta",
            benefits: "Resgates",
            tag: "Boa alternativa",
          },
        ].map((program, index) => (
          <div
            className={`compare-row ${index === 0 ? "recommended" : ""}`}
            key={program.name}
          >
            <div className="program-cell">
              <span className={`program-logo ${program.color}`}>
                {program.icon}
              </span>
              <span>
                <b>{program.name}</b>
                <small>{program.sub}</small>
              </span>
              {index === 0 && <em>RECOMENDADO</em>}
            </div>
            <div className="rating-cell">
              <span className="rating-bar">
                <i
                  style={{
                    width: `${index === 0 ? 92 : index === 1 ? 98 : 82}%`,
                  }}
                />
              </span>
              <b>{program.accumulation}</b>
            </div>
            <div className="rating-cell">
              <span className="rating-bar">
                <i style={{ width: `${index === 0 ? 96 : 89 - index * 7}%` }} />
              </span>
              <b>{program.redemption}</b>
            </div>
            <div className="benefit-cell">
              <span className="benefit-tag">{program.tag}</span>
            </div>
            <button
              className="row-arrow"
              onClick={() =>
                notify(`${program.name} selecionado para comparação`)
              }
            >
              <Icon name="arrowRight" size={16} />
            </button>
          </div>
        ))}
      </div>
      <div className="compare-insight">
        <span className="insight-icon">
          <Icon name="spark" size={18} />
        </span>
        <p>
          <b>Insight do Domine:</b> centralizar pontos na Livelo pode dar mais
          flexibilidade na hora de transferir com bônus.
        </p>
        <button className="link-button" onClick={() => goTo(6)}>
          Aprender mais <Icon name="arrowRight" size={13} />
        </button>
      </div>
    </div>
  );

  const renderMissions = () => {
    const missionCopy = courseMissionCopy[language] ?? courseMissionCopy["pt-BR"];
    const missions = [
      {
        key: "profile_complete" as MissionKey,
        title: missionCopy.missionTitles[0],
        text: missionCopy.missionTexts[0],
        xp: 20,
        icon: "user" as IconName,
        destination: 13,
      },
      {
        key: "lesson_01_complete" as MissionKey,
        title: missionCopy.missionTitles[1],
        text: missionCopy.missionTexts[1],
        xp: 50,
        icon: "play" as IconName,
        destination: 6,
      },
      {
        key: "quiz_module_01_complete" as MissionKey,
        title: missionCopy.missionTitles[2],
        text: missionCopy.missionTexts[2],
        xp: 150,
        icon: "target" as IconName,
        destination: 10,
      },
      {
        key: "simulator_used" as MissionKey,
        title: missionCopy.missionTitles[3],
        text: missionCopy.missionTexts[3],
        xp: 100,
        icon: "calculator" as IconName,
        destination: 7,
      },
    ];
    const reviewAnswered = lesson01ReviewQuestions.filter((question) =>
      getLessonQuestionAttempt(question.id),
    ).length;
    const challengeAnswered = lesson01ChallengeQuestions.filter((question) =>
      getLessonQuestionAttempt(question.id),
    ).length;
    const reviewComplete = reviewAnswered === lesson01ReviewQuestions.length;
    const challengeComplete =
      challengeAnswered === lesson01ChallengeQuestions.length;
    const courseMapItems = [
      {
        title: missionCopy.courseLessonTitle,
        text: missionCopy.courseLessonText,
        status:
          reviewComplete && challengeComplete
            ? "completed"
            : reviewAnswered || challengeAnswered
              ? "in-progress"
              : "next",
        progress: `${reviewAnswered + challengeAnswered} / 20 ${missionCopy.questions}`,
        icon: "book" as IconName,
      },
    ];
    const completedCount = missions.filter((mission) =>
      isMissionComplete(mission.key),
    ).length;
    const inProgressCount = missions.filter(
      (mission) =>
        !isMissionComplete(mission.key) &&
        startedMissionKeys.includes(mission.key),
    ).length;
    const visibleMissions =
      missionView === "all"
        ? missions
        : missionView === "in-progress"
          ? missions.filter(
              (mission) =>
                !isMissionComplete(mission.key) &&
                startedMissionKeys.includes(mission.key),
            )
          : missions.filter((mission) => isMissionComplete(mission.key));
    const totalLessonQuestions =
      lesson01ReviewQuestions.length + lesson01ChallengeQuestions.length;
    const answeredLessonQuestions = reviewAnswered + challengeAnswered;
    return (
      <div className="missions-layout">
        <div className="missions-top">
          <div>
            <span className="small-label">{missionCopy.missionHub}</span>
            <h3>{missionCopy.missionHeadline}</h3>
            <p>
              {missionCopy.missionDescription}
            </p>
          </div>
          <div className="week-progress">
            <div className="week-ring">
              <strong>{missionsLoaded ? levelProgress.level : "–"}</strong>
              <span>{missionCopy.level}</span>
            </div>
            <div>
              <span className="small-label">{missionCopy.xpProgress}</span>
              <b>
                {missionsLoaded
                  ? `${levelProgress.xpIntoLevel} / ${levelProgress.xpToNextLevel} XP · faltam ${levelProgress.xpToNextLevel - levelProgress.xpIntoLevel} XP`
                  : missionCopy.loadingXp}
              </b>
              <ProgressBar
                value={missionsLoaded ? levelProgress.progressPercent : 0}
              />
            </div>
          </div>
        </div>
        <div className="mission-filters">
          <button
            className={missionView === "map" ? "active" : ""}
            onClick={() => setMissionView("map")}
          >
            {missionCopy.map} <b>1</b>
          </button>
          <button
            className={missionView === "all" ? "active" : ""}
            onClick={() => setMissionView("all")}
          >
            {missionCopy.all} <b>4</b>
          </button>
          <button
            className={missionView === "in-progress" ? "active" : ""}
            onClick={() => setMissionView("in-progress")}
          >
            {missionCopy.inProgress} <b>{inProgressCount}</b>
          </button>
          <button
            className={missionView === "completed" ? "active" : ""}
            onClick={() => setMissionView("completed")}
          >
            {missionCopy.completed} <b>{completedCount}</b>
          </button>
          <span className="mission-streak">
            <Icon name="zap" size={15} /> {missionCopy.level} {levelProgress.level} ·{" "}
            {earnedXp} XP
          </span>
        </div>
        {missionView === "map" ? (
          <div className="mission-grid">
            {courseMapItems.map((item, index) => (
              <button
                className={`mission-card ${item.status === "completed" ? "completed" : item.status === "in-progress" ? "in-progress" : ""}`}
                key={item.title}
                onClick={() => goTo(6)}
              >
                <div className={`mission-card-icon icon-${index}`}>
                  <Icon name={item.icon} size={20} />
                </div>
                <div className="mission-card-copy">
                  <div>
                    <span className="mission-state">
                      {item.status === "completed" ? (
                        <>
                          <Icon name="check" size={12} /> {missionCopy.lessonComplete}
                        </>
                      ) : item.status === "in-progress" ? (
                        missionCopy.inProgress
                      ) : (
                        missionCopy.available
                      )}
                    </span>
                    <span className="xp-pill">{item.progress}</span>
                  </div>
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                  <div className="mission-action">
                    {item.status === "completed"
                      ? missionCopy.viewLesson
                      : item.status === "in-progress"
                        ? missionCopy.continueLesson
                        : missionCopy.startLesson}
                    <Icon name="arrowRight" size={15} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mission-grid">
            {visibleMissions.map((mission, index) => {
              const done = isMissionComplete(mission.key);
              const started = startedMissionKeys.includes(mission.key);
              return (
                <button
                  className={`mission-card ${done ? "completed" : started ? "in-progress" : ""}`}
                  key={mission.key}
                  onClick={() =>
                    done
                      ? notify("Esta missão já foi concluída.")
                      : void startMission(mission.key, mission.destination)
                  }
                >
                  <div className={`mission-card-icon icon-${index}`}>
                    <Icon name={mission.icon} size={20} />
                  </div>
                  <div className="mission-card-copy">
                    <div>
                      <span className="mission-state">
                        {done ? (
                          <>
                            <Icon name="check" size={12} /> {missionCopy.lessonComplete}
                          </>
                        ) : started ? (
                          missionCopy.inProgress
                        ) : (
                          missionCopy.nextAction
                        )}
                      </span>
                      <span className="xp-pill">+{mission.xp} XP</span>
                    </div>
                    <h4>{mission.title}</h4>
                    <p>{mission.text}</p>
                    <div className="mission-action">
                      {done
                        ? missionCopy.completedMission
                        : started
                          ? missionCopy.continueMission
                          : missionCopy.startMission}
                      <Icon name="arrowRight" size={15} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <div className="streak-banner">
          <div className="streak-graphic">
            <span>{earnedXp}</span>
            <small>XP</small>
          </div>
          <div>
            <span className="small-label">
              NÍVEL {levelProgress.level} · {levelProgress.title.toUpperCase()}
            </span>
            <h4>
              {levelProgress.xpIntoLevel} de {levelProgress.xpToNextLevel} XP
              para o próximo nível.
            </h4>
          </div>
          <Icon name="trophy" size={31} />
        </div>
      </div>
    );
  };

  const renderQuiz = () => {
    const options = [
      "Transferir pontos sempre que tiver saldo",
      "Esperar uma campanha de bônus de transferência",
      "Usar os pontos apenas em compras no cartão",
      "Escolher o programa com mais anúncios",
    ];
    const retryLocked = quizRetrySeconds > 0;
    const retryClock = `${String(Math.floor(quizRetrySeconds / 3600)).padStart(2, "0")}:${String(Math.floor((quizRetrySeconds % 3600) / 60)).padStart(2, "0")}:${String(quizRetrySeconds % 60).padStart(2, "0")}`;
    const selectQuizAnswer = async (index: number) => {
      if (retryLocked) return;
      setQuizAnswer(index);
      if (index !== 1) {
        const lockedUntil = new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ).toISOString();
        setQuizRetrySeconds(24 * 60 * 60);
        if (authenticatedUser && hasSupabaseBrowserConfig()) {
          const { error } = await createSupabaseClient()
            .from("quiz_attempt_locks")
            .insert({
              user_id: authenticatedUser.id,
              quiz_key: "module_01_question_01",
              locked_until: lockedUntil,
            });
          if (error) console.warn("Could not store quiz retry lock", error);
        }
      }
    };
    const finishQuiz = () => {
      if (retryLocked) {
        notify(`Aguarde ${retryClock} para fazer uma nova tentativa.`);
        return;
      }
      if (quizAnswer !== 1) {
        notify("Escolha a resposta correta para concluir o quiz.");
        return;
      }
      void completeMission("quiz_module_01_complete");
    };
    return (
      <div className="quiz-layout">
        <div className="quiz-progress-top">
          <div>
            <span className="small-label">QUIZ · MÓDULO 01</span>
            <b>
              Desafio final <em>· 01</em>
            </b>
          </div>
          <span>
            {isMissionComplete("quiz_module_01_complete")
              ? "Concluído"
              : retryLocked
                ? `Nova tentativa em ${retryClock}`
                : "Pronto para responder"}
          </span>
          <ProgressBar
            value={isMissionComplete("quiz_module_01_complete") ? 100 : 60}
          />
        </div>
        <div className="quiz-card card-surface">
          <div className="quiz-illustration">
            <span className="quiz-orbit one" />
            <span className="quiz-orbit two" />
            <span className="quiz-bulb">
              <Icon name="spark" size={31} />
            </span>
            <span className="quiz-stars">
              <Icon name="spark" size={17} />
            </span>
          </div>
          <div className="quiz-content">
            <span className="question-type">
              <Icon name="target" size={14} /> ESCOLHA UMA ALTERNATIVA
            </span>
            <h3>
              Qual é o melhor momento para transferir seus pontos para um
              programa de milhas?
            </h3>
            <p>Uma boa estratégia pode aumentar muito o valor do seu saldo.</p>
            <div className="quiz-options">
              {options.map((option, index) => (
                <button
                  key={option}
                  disabled={retryLocked}
                  className={`quiz-option ${quizAnswer === index ? (index === 1 ? "correct" : "wrong") : ""}`}
                  onClick={() => void selectQuizAnswer(index)}
                >
                  <span className="option-letter">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{option}</span>
                  {quizAnswer === index && (
                    <Icon name={index === 1 ? "check" : "close"} size={17} />
                  )}
                </button>
              ))}
            </div>
            {quizAnswer !== null && (
              <div
                className={`quiz-feedback ${quizAnswer === 1 ? "correct" : "wrong"}`}
              >
                <Icon name={quizAnswer === 1 ? "check" : "info"} size={17} />
                <span>
                  <b>
                    {quizAnswer === 1 ? "Muito bem!" : "Resposta incorreta."}
                  </b>{" "}
                  {quizAnswer === 1
                    ? "Campanhas de bônus são o momento mais inteligente para transferir."
                    : `Esta questão fica bloqueada por 24 horas. Nova tentativa em ${retryClock}.`}
                </span>
              </div>
            )}
            {retryLocked && (
              <div className="quiz-feedback wrong">
                <Icon name="info" size={17} />
                <span>
                  <b>Nova tentativa bloqueada por 24 horas.</b> Aguarde{" "}
                  {retryClock} para escolher outra alternativa.
                </span>
              </div>
            )}
            <div className="quiz-actions">
              <button
                className="text-button"
                disabled={retryLocked}
                onClick={() => setQuizAnswer(null)}
              >
                Limpar resposta
              </button>
              <button className="button button-primary" onClick={finishQuiz}>
                {isMissionComplete("quiz_module_01_complete")
                  ? "Quiz concluído"
                  : retryLocked
                    ? `Aguarde ${retryClock}`
                    : "Concluir quiz"}{" "}
                <Icon name="arrowRight" size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProject = () => (
    <div className="project-layout">
      <div className="project-intro">
        <div>
          <span className="small-label">PROJETO FINAL · DESAFIO 01</span>
          <h3>Planeje sua próxima viagem com milhas.</h3>
          <p>
            Chegou a hora de juntar tudo o que você aprendeu em um plano que faz
            sentido para você.
          </p>
        </div>
        <div className="project-reward">
          <span className="reward-medal">
            <Icon name="trophy" size={23} />
          </span>
          <div>
            <span>RECOMPENSA</span>
            <b>+500 XP</b>
          </div>
        </div>
      </div>
      <div className="project-workspace">
        <div className="project-brief card-surface">
          <div className="brief-heading">
            <span className="brief-icon">
              <Icon name="plane" size={19} />
            </span>
            <div>
              <span className="small-label">SEU BRIEFING</span>
              <h4>Uma viagem para duas pessoas</h4>
            </div>
            <span className="brief-status">EM ANDAMENTO</span>
          </div>
          <div className="brief-grid">
            <div>
              <span>Destino dos sonhos</span>
              <strong>Lisboa, Portugal</strong>
            </div>
            <div>
              <span>Período</span>
              <strong>Outubro 2026</strong>
            </div>
            <div>
              <span>Orçamento</span>
              <strong>{formatCurrency(8000, language)}</strong>
            </div>
            <div>
              <span>Saldo atual</span>
              <strong>42.850 pts</strong>
            </div>
          </div>
          <div className="brief-checklist">
            <span className="small-label">CHECKLIST DO PROJETO</span>
            <div>
              <span className="check-square done">
                <Icon name="check" size={13} />
              </span>
              <span>Definir destino e período</span>
              <b>Concluído</b>
            </div>
            <div>
              <span className="check-square done">
                <Icon name="check" size={13} />
              </span>
              <span>Escolher o melhor programa</span>
              <b>Concluído</b>
            </div>
            <div>
              <span className="check-square" />
              <span>Encontrar a melhor rota</span>
              <b>Em aberto</b>
            </div>
            <div>
              <span className="check-square" />
              <span>Calcular pontos necessários</span>
              <b>Em aberto</b>
            </div>
          </div>
          <button
            className="button button-primary full-button"
            onClick={() => notify("Projeto salvo como rascunho")}
          >
            Continuar projeto <Icon name="arrowRight" size={16} />
          </button>
        </div>
        <div className="project-aside">
          <div className="project-route card-surface">
            <div className="route-heading">
              <span>SUA ROTA</span>
              <button>
                <Icon name="external" size={14} />
              </button>
            </div>
            <div className="route-map">
              <span className="map-dot origin" />
              <span className="map-dot destination" />
              <svg viewBox="0 0 280 120" preserveAspectRatio="none">
                <path d="M25 88 C 80 36, 138 105, 205 42" />
              </svg>
              <span className="route-origin">
                GRU
                <br />
                <small>São Paulo</small>
              </span>
              <span className="route-dest">
                LIS
                <br />
                <small>Lisboa</small>
              </span>
              <Icon name="plane" size={20} />
            </div>
            <div className="route-foot">
              <span>1 conexão</span>
              <span>8.7k milhas</span>
            </div>
          </div>
          <div className="coach-card">
            <Icon name="spark" size={19} />
            <div>
              <span>DICA DO COACH</span>
              <p>
                Flexibilizar 2 dias pode economizar até <b>30% dos pontos.</b>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProgress = () => {
    const completedCount = missionCompletions.length;
    const progressPercent = levelProgress.progressPercent;
    return (
      <div className="progress-layout">
        <div className="progress-hero card-surface">
          <div className="progress-profile">
            <div className="profile-medal">
              <span>{String(levelProgress.level).padStart(2, "0")}</span>
              <Icon name="star" size={18} />
            </div>
            <div>
              <span className="small-label">SEU NÍVEL ATUAL</span>
              <h3>{levelProgress.title}</h3>
              <p>{earnedXp} XP acumulados nesta jornada</p>
            </div>
          </div>
          <div className="level-track">
            <div className="level-track-label">
              <span>Nível {levelProgress.level}</span>
              <b>
                {levelProgress.xpIntoLevel} / {levelProgress.xpToNextLevel} XP
              </b>
              <span>Nível {levelProgress.level + 1}</span>
            </div>
            <ProgressBar value={progressPercent} />
          </div>
          <div className="progress-summary">
            <span>
              <b>{completedCount}</b> missões concluídas
            </span>
            <span>
              <b>{isMissionComplete("lesson_01_complete") ? 1 : 0}</b> aulas
              assistidas
            </span>
            <span>
              <b>{progressPercent}%</b> até o próximo nível
            </span>
          </div>
        </div>
        <div className="progress-columns">
          <div className="achievements-panel card-surface">
            <div className="panel-heading">
              <div>
                <span className="small-label">COLEÇÃO</span>
                <h4>Conquistas</h4>
              </div>
              <span className="collection-count">{completedCount} / 4</span>
            </div>
            <div className="badge-grid">
              <div
                className={`badge-card ${isMissionComplete("lesson_01_complete") ? "unlocked" : "locked"}`}
              >
                <span>
                  <Icon
                    name={
                      isMissionComplete("lesson_01_complete") ? "play" : "lock"
                    }
                    size={19}
                  />
                </span>
                <b>Primeira aula</b>
                <small>
                  {isMissionComplete("lesson_01_complete")
                    ? "Você começou!"
                    : "Conclua a aula 01"}
                </small>
              </div>
              <div
                className={`badge-card ${isMissionComplete("profile_complete") ? "unlocked yellow-badge" : "locked"}`}
              >
                <span>
                  <Icon
                    name={
                      isMissionComplete("profile_complete") ? "user" : "lock"
                    }
                    size={19}
                  />
                </span>
                <b>Perfil completo</b>
                <small>
                  {isMissionComplete("profile_complete")
                    ? "Tudo pronto!"
                    : "Complete seus dados"}
                </small>
              </div>
              <div
                className={`badge-card ${isMissionComplete("simulator_used") ? "unlocked purple-badge" : "locked"}`}
              >
                <span>
                  <Icon
                    name={
                      isMissionComplete("simulator_used")
                        ? "calculator"
                        : "lock"
                    }
                    size={19}
                  />
                </span>
                <b>Primeira projeção</b>
                <small>
                  {isMissionComplete("simulator_used")
                    ? "Simulação salva"
                    : "Use o simulador"}
                </small>
              </div>
              <div
                className={`badge-card ${isMissionComplete("quiz_module_01_complete") ? "unlocked green-badge" : "locked"}`}
              >
                <span>
                  <Icon
                    name={
                      isMissionComplete("quiz_module_01_complete")
                        ? "target"
                        : "lock"
                    }
                    size={19}
                  />
                </span>
                <b>Em missão</b>
                <small>
                  {isMissionComplete("quiz_module_01_complete")
                    ? "Quiz concluído"
                    : "Faça o quiz"}
                </small>
              </div>
            </div>
            <button className="link-button center-link" onClick={() => goTo(9)}>
              Ver missões <Icon name="arrowRight" size={14} />
            </button>
          </div>
          <div className="certificate-panel">
            <div className="certificate-paper">
              <div className="certificate-deco one" />
              <div className="certificate-deco two" />
              <span className="certificate-mini-logo">
                <Icon name="plane" size={17} />
              </span>
              <span className="small-label">CERTIFICADO DE JORNADA</span>
              <h4>
                Domine suas
                <br />
                <strong>Milhas</strong>
              </h4>
              <p>
                Este certificado será desbloqueado ao concluir todos os módulos.
              </p>
              <div className="certificate-lock">
                <Icon name="lock" size={14} /> Nível {levelProgress.level}
              </div>
              <div className="certificate-sign">
                {brand.tagline} <span>2026</span>
              </div>
            </div>
            <button
              className="button button-outline full-button"
              onClick={() =>
                notify("O certificado será liberado ao concluir o curso")
              }
            >
              <Icon name="download" size={16} /> Como desbloquear
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderProfile = () => {
    if (!authenticatedUser)
      return (
        <div className="profile-empty card-surface">
          <Icon name="lock" size={24} />
          <h3>Entre para criar seu perfil</h3>
          <p>Seus dados e preferências ficam associados à sua conta.</p>
          <Link
            href="/cadastro?next=%2Fperfil"
            className="button button-primary"
          >
            Entrar ou criar conta <Icon name="arrowRight" size={16} />
          </Link>
        </div>
      );
    if (!profileLoaded)
      return (
        <div className="profile-empty card-surface">
          <span className="loading-orbit" />
          <h3>Carregando seu perfil</h3>
          <p>Estamos preparando suas preferências com segurança.</p>
        </div>
      );

    const profileFormFields = (
      <>
        <label className="field-label">
          Nome de usuário
          <input
            value={profileForm.displayName}
            onChange={(event) =>
              setProfileForm((current) => ({
                ...current,
                displayName: event.target.value,
              }))
            }
            placeholder="Como quer ser chamado?"
            maxLength={60}
          />
        </label>
        <label className="field-label">
          Nome completo
          <input
            value={profileForm.fullName}
            onChange={(event) =>
              setProfileForm((current) => ({
                ...current,
                fullName: event.target.value,
              }))
            }
            placeholder="Seu nome completo"
            maxLength={120}
          />
        </label>
        <label className="field-label">
          E-mail da conta
          <input value={authenticatedUser.email ?? ""} readOnly disabled />
        </label>
        <label className="field-label">
          País
          <select
            value={profileForm.country}
            onChange={(event) =>
              setProfileForm((current) => ({
                ...current,
                country: event.target.value,
              }))
            }
          >
            <option>Brasil</option>
            <option>Portugal</option>
            <option>Estados Unidos</option>
            <option>Espanha</option>
            <option>Japão</option>
            <option>China</option>
            <option>Outro</option>
          </select>
        </label>
        <div className="favorite-programs">
          <span className="field-label">Programas favoritos</span>
          <p>Escolha os programas que você quer acompanhar.</p>
          <div>
            {["Livelo", "Smiles", "TudoAzul", "LATAM Pass", "Esfera"].map(
              (program) => (
                <button
                  type="button"
                  key={program}
                  className={
                    profileForm.favoritePrograms.includes(program)
                      ? "selected"
                      : ""
                  }
                  onClick={() => toggleFavoriteProgram(program)}
                >
                  {profileForm.favoritePrograms.includes(program) && (
                    <Icon name="check" size={13} />
                  )}
                  {program}
                </button>
              ),
            )}
          </div>
        </div>
      </>
    );

    if (!studentProfile)
      return (
        <div className="profile-setup card-surface">
          <div className="profile-setup-copy">
            <span className="small-label">SEU PRIMEIRO ACESSO</span>
            <h3>Crie seu perfil</h3>
            <p>
              Escolha como quer aparecer na plataforma. Seu e-mail de acesso
              permanece protegido e não pode ser alterado aqui.
            </p>
            <div className="profile-email-lock">
              <Icon name="lock" size={16} />
              <span>{authenticatedUser.email}</span>
            </div>
          </div>
          <div className="settings-form">
            {profileFormFields}
            <button
              type="button"
              className="button button-primary full-button"
              disabled={profileSaving || signingOut}
              onClick={saveStudentProfile}
            >
              {profileSaving ? "Salvando…" : "Criar meu perfil"}
              <Icon name="arrowRight" size={16} />
            </button>
            <button
              type="button"
              className="button profile-sign-out full-button"
              disabled={signingOut}
              onClick={() => void signOutCurrentAccount()}
            >
              {signingOut ? "Saindo da conta…" : "Sair da conta"}
              <Icon name="arrowLeft" size={16} />
            </button>
          </div>
        </div>
      );

    const initials =
      profileName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "AL";
    return (
      <div className="profile-layout">
        <div className="profile-hero">
          <label className="profile-avatar-editor">
            <span className="profile-big-avatar">
              {profileImage ? (
                <img src={profileImage} alt={`Foto de ${profileName}`} />
              ) : (
                initials
              )}
              <span className="online-dot" />
            </span>
            <span className="avatar-edit">
              {avatarUploading ? "Enviando…" : "Trocar foto"}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => void uploadAvatar(event.target.files?.[0])}
              disabled={avatarUploading}
            />
          </label>
          <div className="profile-identity">
            <span className="small-label">PERFIL DO ALUNO</span>
            <h3>{profileName}</h3>
            <p>
              {studentProfile.country} <span>•</span> Perfil personalizado
            </p>
          </div>
          <div className="profile-hero-actions">
            <button
              type="button"
              className="button profile-sign-out"
              disabled={signingOut}
              onClick={() => void signOutCurrentAccount()}
            >
              {signingOut ? "Saindo da conta…" : "Sair da conta"}
              <Icon name="arrowLeft" size={16} />
            </button>
            <span>Isso não apaga sua conta.</span>
          </div>
        </div>
        {(googleAvatarUrl || avatarUrl) && (
          <section
            className="profile-avatar-choice card-surface"
            aria-label="Escolha da foto principal"
          >
            <div>
              <span className="small-label">FOTO PRINCIPAL</span>
              <h4>Qual foto deve ficar fixa?</h4>
              <p>
                Escolha a imagem que aparece no seu perfil ao entrar na
                plataforma.
              </p>
            </div>
            <div className="avatar-choice-options">
              <button
                type="button"
                className={`avatar-choice ${selectedAvatarSource === "google" ? "selected" : ""}`}
                disabled={!googleAvatarUrl || avatarPreferenceSaving}
                onClick={() => void saveAvatarPreference("google")}
              >
                <span className="avatar-choice-preview">
                  {googleAvatarUrl ? (
                    <img src={googleAvatarUrl} alt="Foto da conta Google" />
                  ) : (
                    <Icon name="user" size={18} />
                  )}
                </span>
                <span>
                  <b>Foto da conta Google</b>
                  <small>
                    {googleAvatarUrl
                      ? "Usar como foto principal"
                      : "Não disponível neste login"}
                  </small>
                </span>
                {selectedAvatarSource === "google" && (
                  <Icon name="check" size={17} />
                )}
              </button>
              <button
                type="button"
                className={`avatar-choice ${selectedAvatarSource === "uploaded" ? "selected" : ""}`}
                disabled={!avatarUrl || avatarPreferenceSaving}
                onClick={() => void saveAvatarPreference("uploaded")}
              >
                <span className="avatar-choice-preview">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Foto enviada ao perfil" />
                  ) : (
                    <Icon name="user" size={18} />
                  )}
                </span>
                <span>
                  <b>Foto enviada ao perfil</b>
                  <small>
                    {avatarUrl
                      ? "Usar como foto principal"
                      : "Envie uma foto para usar esta opção"}
                  </small>
                </span>
                {selectedAvatarSource === "uploaded" && (
                  <Icon name="check" size={17} />
                )}
              </button>
            </div>
          </section>
        )}
        <div className="profile-columns">
          <div className="settings-panel card-surface">
            <div className="settings-content">
              <div className="settings-title">
                <span className="small-label">DADOS PESSOAIS</span>
                <h4>Seu perfil</h4>
                <p>
                  O e-mail é vinculado ao login e não pode ser editado nesta
                  área.
                </p>
              </div>
              <div className="settings-form">{profileFormFields}</div>
              <button
                className="button button-primary"
                disabled={profileSaving}
                onClick={saveStudentProfile}
              >
                {profileSaving ? "Salvando…" : "Salvar alterações"}
                <Icon name="check" size={16} />
              </button>
            </div>
          </div>
          <div className="language-panel card-surface">
            <div className="language-panel-head">
              <span className="panel-icon">
                <Icon name="globe" size={19} />
              </span>
              <div>
                <span className="small-label">INTERNACIONAL</span>
                <h4>{copy.language}</h4>
              </div>
            </div>
            <p>Escolha o idioma que será usado em toda a plataforma.</p>
            <div className="profile-language-list">
              {languageOptions.map((option) => (
                <button
                  className={option.code === language ? "selected" : ""}
                  key={option.code}
                  onClick={() => selectLanguage(option.code)}
                >
                  <span>
                    <img
                      className="country-flag"
                      src={`/flags/${option.flag}.svg`}
                      alt=""
                    />
                  </span>
                  <div>
                    <b>{option.label}</b>
                    <small>{option.native}</small>
                  </div>
                  {option.code === language ? (
                    <span className="language-current">
                      <Icon name="check" size={15} />
                    </span>
                  ) : (
                    <Icon name="arrowRight" size={15} />
                  )}
                </button>
              ))}
            </div>
            <div className="language-panel-foot">
              <Icon name="info" size={14} /> Salve o perfil para manter também
              esta escolha.
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCertificate = () => (
    <div className="finish-layout">
      <div className="finish-copy">
        <span className="finish-star">
          <Icon name="spark" size={22} />
        </span>
        <span className="small-label">JORNADA PRONTA PARA DECOLAR</span>
        <h3>
          O próximo destino começa com o próximo <span>passo.</span>
        </h3>
        <p>
          Esta é a experiência {brand.tagline}: uma plataforma para
          transformar pontos, clareza e confiança em mais viagens.
        </p>
        <div className="finish-actions">
          <button
            className="button button-primary button-large"
            onClick={() => goTo(4)}
          >
            Voltar ao dashboard <Icon name="arrowRight" size={18} />
          </button>
          <button className="text-button" onClick={() => goTo(0)}>
            Voltar ao início <Icon name="arrowRight" size={15} />
          </button>
        </div>
        <div className="finish-signature">
          <span className="signature-line" />{" "}
          <span>
            Equipe {brand.tagline}
            <br />
            <small>{brand.tagline} • 2026</small>
          </span>
        </div>
      </div>
      <div className="finish-certificate">
        <div className="certificate-large">
          <div className="certificate-corner corner-one" />
          <div className="certificate-corner corner-two" />
          <span className="certificate-large-brand">
            <Icon name="plane" size={18} /> {brand.tagline}
          </span>
          <span className="certificate-large-eyebrow">
            CERTIFICADO DE CONCLUSÃO
          </span>
          <div className="certificate-large-star">
            <Icon name="star" size={29} />
          </div>
          <h4>
            Você está
            <br />
            <strong>pronto para decolar.</strong>
          </h4>
          <p>
            Uma jornada de aprendizado criada para quem quer viajar mais,
            pagando menos.
          </p>
          <div className="certificate-large-bottom">
            <span>JOÃO SILVA</span>
            <span>2026</span>
          </div>
        </div>
        <div className="finish-side-note">
          <span className="note-dot" />
          <b>Uma jornada completa</b>
          <span>do básico ao avançado</span>
        </div>
      </div>
    </div>
  );

  const renderSlide = () => {
    switch (slide) {
      case 0:
        return (
          <div className={`home-flow ${homeMotionStyles.flow}`}>
            {renderCover()}
            <section
              className="home-video-introduction hero-scroll-reveal"
              aria-labelledby="video-introduction-title"
            >
              <div className="home-video-copy">
                <span className="home-video-eyebrow">
                  APRESENTAÇÃO EM VÍDEO
                </span>
                <h2 id="video-introduction-title">
                  Conheça quem transforma milhas em novas rotas
                </h2>
                <p>
                  Uma conversa para você entender como planejamento, estratégia
                  e escolhas inteligentes podem levar sua próxima viagem mais
                  longe.
                </p>
              </div>
              <div className="home-video-frame">
                <video
                  ref={presentationVideoRef}
                  controls
                  playsInline
                  preload="metadata"
                  poster="/presentation/milhas-rotadas-checkout.jpg"
                  aria-label="Apresentação da Milhas Rotadas"
                  onPlay={() => {
                    const audio = presentationAudioRef.current;
                    if (presentationAudioLanguage === "pt-BR" || !audio) return;
                    syncPresentationAudio();
                    void audio.play().catch(() => undefined);
                  }}
                  onPause={() => presentationAudioRef.current?.pause()}
                  onSeeking={syncPresentationAudio}
                  onTimeUpdate={syncPresentationAudio}
                  onEnded={() => presentationAudioRef.current?.pause()}
                >
                  <source
                    src="/presentation/milhas-rotadas-apresentacao.mp4"
                    type="video/mp4"
                  />
                  <track
                    kind="subtitles"
                    srcLang="pt-BR"
                    label="Português (Brasil)"
                    src="/presentation/legenda-pt-BR.vtt"
                    default
                  />
                  <track
                    kind="subtitles"
                    srcLang="en"
                    label="English"
                    src="/presentation/legenda-en.vtt"
                  />
                  <track
                    kind="subtitles"
                    srcLang="pt-PT"
                    label="Português (Portugal)"
                    src="/presentation/legenda-pt-PT.vtt"
                  />
                  <track
                    kind="subtitles"
                    srcLang="es"
                    label="Español"
                    src="/presentation/legenda-es.vtt"
                  />
                  <track
                    kind="subtitles"
                    srcLang="ja"
                    label="日本語"
                    src="/presentation/legenda-ja.vtt"
                  />
                  <track
                    kind="subtitles"
                    srcLang="zh"
                    label="中文（简体）"
                    src="/presentation/legenda-zh.vtt"
                  />
                  Seu navegador não suporta a reprodução deste vídeo.
                </video>
                <audio
                  ref={presentationAudioRef}
                  src={
                    presentationAudioSources[presentationAudioLanguage] ??
                    undefined
                  }
                  preload="metadata"
                  onEnded={() => presentationVideoRef.current?.pause()}
                />
                <label className="video-audio-language">
                  <span>Áudio do vídeo</span>
                  <select
                    value={presentationAudioLanguage}
                    onChange={(event) =>
                      setPresentationAudioLanguage(event.target.value as Lang)
                    }
                  >
                    <option value="pt-BR">
                      Português (Brasil) · voz original
                    </option>
                    <option value="en">English</option>
                    <option value="pt-PT">Português (Portugal)</option>
                    <option value="es">Español</option>
                    <option value="zh">中文（简体）</option>
                    <option value="ja">日本語</option>
                  </select>
                  <small>
                    As legendas podem ser escolhidas no botão CC do vídeo.
                  </small>
                </label>
              </div>
            </section>
            <section
              id="introducao"
              className="home-section hero-scroll-reveal"
            >
              <div className="home-section-heading">
                <span className="small-label">{brand.tagline}</span>
                <h2>{copy.slides[1].title}</h2>
                <p>{copy.slides[1].description}</p>
              </div>
              {renderConcept()}
            </section>
            <section
              className="travel-memories hero-scroll-reveal home-reveal"
              aria-labelledby="travel-memories-title"
            >
              <div className="travel-memories-heading">
                <div>
                  <span className="small-label">
                    MILHAS QUE VIRARAM MEMÓRIAS
                  </span>
                  <h2 id="travel-memories-title">
                    Milhas que viraram memórias
                  </h2>
                </div>
                <p>
                  Antes de ensinar a viajar com mais estratégia, ela viveu cada
                  rota. Agora, sua próxima lembrança pode começar aqui.
                </p>
              </div>
              <div className="travel-memory-cards">
                {travelMemories.map((memory, index) => (
                  <button
                    type="button"
                    className="travel-memory-card motion-memory-card"
                    key={memory.country}
                    data-memory-index={index}
                    aria-label={`Abrir foto de ${memory.country} em tela cheia`}
                    onDoubleClick={() => setActiveMemory(memory)}
                    onTouchStart={(event) => {
                      const touch = event.touches[0];
                      if (touch)
                        memoryTouchStart.current = {
                          x: touch.clientX,
                          y: touch.clientY,
                        };
                    }}
                    onTouchEnd={(event) => openMemoryFromTouch(memory, event)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ")
                        setActiveMemory(memory);
                    }}
                  >
                    <Image
                      src={memory.image}
                      alt={`Viagem pela ${memory.country}`}
                      fill
                      sizes="(max-width: 620px) 46vw, (max-width: 980px) 30vw, 240px"
                      className="travel-memory-photo"
                    />
                    <div className="travel-memory-overlay" />
                    <div className="travel-memory-top">
                      <span className="travel-flag">
                        <img src={`/flags/${memory.flag}.svg`} alt="" />{" "}
                        {memory.country}
                      </span>
                    </div>
                    <p>{memory.note}</p>
                  </button>
                ))}
                <Link
                  href="/como-funciona"
                  className="travel-memory-next travel-memory-next-card motion-stamp-card"
                >
                  <span className="travel-memory-next-icon">
                    <Icon name="plane" size={22} />
                  </span>
                  <span className="small-label">SUA VEZ</span>
                  <h3>O próximo carimbo pode ser seu</h3>
                  <p>Aprenda a transformar seus pontos em novas histórias.</p>
                  <span className="travel-memory-next-action">
                    Ver como funciona <Icon name="arrowRight" size={16} />
                  </span>
                </Link>
              </div>
            </section>
            {renderTravelerTestimonials()}
            <section className="home-section">
              <div className="home-section-heading">
                <h2>{copy.slides[5].title}</h2>
                <p>Avance pelos módulos e desbloqueie novas estratégias.</p>
              </div>
              <div className="module-list">
                {modules.map((module) => (
                  <Link
                    href="/checkout"
                    className="module-row open"
                    key={module.number}
                  >
                    <span className="module-number open">
                      <span>{module.number}</span>
                    </span>
                    <span className="module-icon open">
                      <Icon name={module.icon} size={19} />
                    </span>
                    <span className="module-info">
                      <b>{module.title}</b>
                      <small>{module.meta}</small>
                    </span>
                    <Icon name="arrowRight" size={17} />
                  </Link>
                ))}
              </div>
            </section>
            <section className="home-enroll card-surface home-reveal motion-journey-card">
              <div>
                <span className="small-label">UMA JORNADA COMPLETA</span>
                <h2>Comece sua jornada</h2>
                <p>Aprenda no seu ritmo</p>
              </div>
              <Link
                href="/checkout"
                className="button button-primary button-large"
              >
                {copy.start}
                <Icon name="arrowRight" size={18} />
              </Link>
            </section>
            <section
              className="home-links card-surface home-reveal"
              aria-labelledby="meus-links-title"
            >
              <div className="home-links-heading">
                <span className="small-label">RECURSOS EXTERNOS</span>
                <h2 id="meus-links-title">Meus links</h2>
                <p>Recursos selecionados para sua jornada</p>
              </div>
              <div className="home-links-grid">
                <a
                  className="home-link-card motion-link-card chip-link"
                  href="https://omeuchip.com/?ref=LARYANYFARIAS"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="home-link-icon" aria-hidden="true">
                    <Icon name="globe" size={20} />
                  </span>
                  <span className="home-link-copy">
                    <b>Conectividade para a sua viagem</b>
                    <small>Conheça os planos de chip internacional</small>
                  </span>
                  <span className="home-link-action">
                    Abrir Meu Chip <Icon name="external" size={15} />
                  </span>
                </a>
                <a
                  className="home-link-card motion-link-card form-link"
                  href="https://docs.google.com/forms/d/e/1FAIpQLSd5ZDJi7WaJIGDDL5WPRwkQRXEBx_gj6jpz1hhtmk9jn_atqg/viewform"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="home-link-icon" aria-hidden="true">
                    <Icon name="mail" size={20} />
                  </span>
                  <span className="home-link-copy">
                    <b>Formulário de interesse</b>
                    <small>Conte-nos como podemos ajudar</small>
                  </span>
                  <span className="home-link-action">
                    Abrir formulário <Icon name="external" size={15} />
                  </span>
                </a>
              </div>
            </section>
          </div>
        );
      case 1:
        return renderConcept();
      case 2:
        return renderSecureAccess();
      case 3:
        return renderPaymentStatus();
      case 4:
        return renderDashboard();
      case 5:
        return renderCourseMap();
      case 6:
        return renderLesson();
      case 7:
        return renderSimulator();
      case 8:
        return renderComparator();
      case 9:
        return renderMissions();
      case 10:
        return renderQuiz();
      case 11:
        return renderProject();
      case 12:
        return renderProgress();
      case 13:
        return renderProfile();
      case 14:
        return renderCertificate();
      case 15:
        return renderCheckout();
      case 16:
        return renderPasswordReset();
      default:
        return renderCover();
    }
  };

  const currentPage = copy.slides[slide] ?? {
    title: "Checkout seguro",
    description: "Seu acesso começa com uma compra segura.",
  };

  return localize(
    <main className="prototype-app site-app">
      {renderHeader()}
      {slide > 1 && slide !== 15 && slide !== 16 && (
        <div className="site-demo-note">
          <Icon name="info" size={15} />
          <span>{siteNotice[language].demo}</span>
          <Link href="/painel">{siteNotice[language].explore}</Link>
        </div>
      )}
      <section className={`slide-shell site-shell page-${slide}`}>
        {slide !== 0 && (
          <div className="slide-heading">
            <div>
              {slide === 5 && (
                <span className="course-welcome-subtitle">Seja bem-vindo</span>
              )}
              <h1>{currentPage.title}</h1>
              <p>{currentPage.description}</p>
            </div>
          </div>
        )}
        <div className="slide-content">{renderSlide()}</div>
      </section>
      <footer className="site-footer">
        <span>© 2026 {brand.name} — {brand.tagline}</span>
        <nav>
          <Link href="/">Início</Link>
          <Link href="/como-funciona">{copy.slides[1].title}</Link>
          <Link href="/curso">Curso</Link>
          <Link href="/painel">{siteNotice[language].explore}</Link>
          <Link href="/progresso">{copy.slides[12].title}</Link>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/cookies">Cookies</Link>
          <Link href="/termos">Termos</Link>
          <Link href="/reembolso">Reembolso</Link>
          <Link href="/direitos">Seus direitos</Link>
          <CookiePreferencesLink />
        </nav>
      </footer>
      <CookiePreferences />
      {renderSocialShortcuts()}
      {renderBottomNav()}
      {activeMemory && (
        <div
          className="travel-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Foto ampliada"
          onClick={() => setActiveMemory(null)}
        >
          <button
            type="button"
            className="travel-lightbox-close"
            aria-label="Fechar foto"
            onClick={() => setActiveMemory(null)}
          >
            <Icon name="close" size={22} />
          </button>
          <button
            type="button"
            className="travel-lightbox-arrow previous"
            aria-label="Foto anterior"
            onClick={(event) => {
              event.stopPropagation();
              changeActiveMemory(-1);
            }}
          >
            <Icon name="arrowLeft" size={22} />
          </button>
          <div
            className="travel-lightbox-image"
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={() => setActiveMemory(null)}
            onPointerDown={handleLightboxPointerDown}
            onPointerUp={handleLightboxPointerUp}
          >
            <Image
              src={activeMemory.image}
              alt={`Viagem pela ${activeMemory.country}`}
              fill
              sizes="(max-width: 620px) 94vw, 74vw"
              className="travel-lightbox-photo"
              priority
            />
          </div>
          <button
            type="button"
            className="travel-lightbox-arrow next"
            aria-label="Próxima foto"
            onClick={(event) => {
              event.stopPropagation();
              changeActiveMemory(1);
            }}
          >
            <Icon name="arrowRight" size={22} />
          </button>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>
            <Icon name="info" size={15} />
          </span>
          {toast}
        </div>
      )}
    </main>,
  );
}
