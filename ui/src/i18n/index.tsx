import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type AppLocale } from "@paperclipai/shared";
import { messages } from "./messages";

type MessageValues = Record<string, string | number | null | undefined>;

const LOCALE_STORAGE_KEY = "paperclip.locale";
const DEFAULT_LOCALE: AppLocale = "ko";

let activeLocale: AppLocale = DEFAULT_LOCALE;

function interpolate(template: string, values?: MessageValues): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_match, key) => String(values[key] ?? ""));
}

function lookupMessage(locale: AppLocale, key: string) {
  return messages[locale][key] ?? messages.en[key];
}

export function setActiveLocale(locale: AppLocale) {
  activeLocale = locale;
}

export function getActiveLocale(): AppLocale {
  return activeLocale;
}

export function humanizeEnumValue(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function translate(key: string, values?: MessageValues): string {
  const resolved = lookupMessage(activeLocale, key);
  if (!resolved) return key;
  if (typeof resolved === "function") return resolved(values);
  return interpolate(resolved, values);
}

export function translateEnum(prefix: string, value: string): string {
  const key = `${prefix}.${value}`;
  const translated = translate(key);
  return translated === key ? humanizeEnumValue(value) : translated;
}

interface I18nContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: string, values?: MessageValues) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: translate,
});

function readInitialLocale(): AppLocale {
  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() => readInitialLocale());

  const setLocale = useCallback((nextLocale: AppLocale) => {
    setLocaleState(nextLocale);
  }, []);

  useEffect(() => {
    setActiveLocale(locale);
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      } catch {
        // ignore storage errors
      }
    }
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, values) => {
        const resolved = lookupMessage(locale, key);
        if (!resolved) return key;
        if (typeof resolved === "function") return resolved(values);
        return interpolate(resolved, values);
      },
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useT() {
  return useI18n().t;
}
