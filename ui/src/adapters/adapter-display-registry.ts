/**
 * Single source of truth for adapter display metadata.
 *
 * Built-in adapters have entries in `adapterDisplayMap`. External (plugin)
 * adapters get sensible defaults derived from their type string via
 * `getAdapterDisplay()`.
 */
import type { ComponentType } from "react";
import { translate } from "../i18n";
import {
  Bot,
  Code,
  Gem,
  MousePointer2,
  Sparkles,
  Terminal,
  Cpu,
} from "lucide-react";
import { OpenCodeLogoIcon } from "@/components/OpenCodeLogoIcon";
import { HermesIcon } from "@/components/HermesIcon";

// ---------------------------------------------------------------------------
// Type suffix parsing
// ---------------------------------------------------------------------------

const TYPE_SUFFIXES: Record<string, string> = {
  _local: "local",
  _gateway: "gateway",
};

function getTypeSuffix(type: string): string | null {
  for (const [suffix, mode] of Object.entries(TYPE_SUFFIXES)) {
    if (type.endsWith(suffix)) return mode;
  }
  return null;
}

function withSuffix(label: string, suffix: string | null): string {
  return suffix ? `${label} (${suffix})` : label;
}

// ---------------------------------------------------------------------------
// Display metadata per adapter type
// ---------------------------------------------------------------------------

export interface AdapterDisplayInfo {
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  recommended?: boolean;
  comingSoon?: boolean;
  disabledLabel?: string;
}

interface AdapterDisplayConfig
  extends Omit<AdapterDisplayInfo, "label" | "description" | "disabledLabel"> {
  label: string;
  description: string;
  disabledLabel?: string;
  labelKey?: string;
  descriptionKey?: string;
  disabledLabelKey?: string;
}

const adapterDisplayMap: Record<string, AdapterDisplayConfig> = {
  claude_local: {
    label: "Claude Code",
    description: "Local Claude agent",
    labelKey: "adapterDisplay.claude.label",
    descriptionKey: "adapterDisplay.claude.description",
    icon: Sparkles,
    recommended: true,
  },
  codex_local: {
    label: "Codex",
    description: "Local Codex agent",
    labelKey: "adapterDisplay.codex.label",
    descriptionKey: "adapterDisplay.codex.description",
    icon: Code,
    recommended: true,
  },
  gemini_local: {
    label: "Gemini CLI",
    description: "Local Gemini agent",
    labelKey: "adapterDisplay.gemini.label",
    descriptionKey: "adapterDisplay.gemini.description",
    icon: Gem,
  },
  opencode_local: {
    label: "OpenCode",
    description: "Local multi-provider agent",
    labelKey: "adapterDisplay.opencode.label",
    descriptionKey: "adapterDisplay.opencode.description",
    icon: OpenCodeLogoIcon,
  },
  hermes_local: {
    label: "Hermes Agent",
    description: "Local Hermes CLI agent",
    labelKey: "adapterDisplay.hermes.label",
    descriptionKey: "adapterDisplay.hermes.description",
    icon: HermesIcon,
  },
  pi_local: {
    label: "Pi",
    description: "Local Pi agent",
    labelKey: "adapterDisplay.pi.label",
    descriptionKey: "adapterDisplay.pi.description",
    icon: Terminal,
  },
  cursor: {
    label: "Cursor",
    description: "Local Cursor agent",
    labelKey: "adapterDisplay.cursor.label",
    descriptionKey: "adapterDisplay.cursor.description",
    icon: MousePointer2,
  },
  openclaw_gateway: {
    label: "OpenClaw Gateway",
    description: "Invoke OpenClaw via gateway protocol",
    labelKey: "adapterDisplay.openclaw.label",
    descriptionKey: "adapterDisplay.openclaw.description",
    icon: Bot,
    comingSoon: true,
    disabledLabel: "Configure OpenClaw within the App",
    disabledLabelKey: "adapterDisplay.openclaw.disabled",
  },
  process: {
    label: "Process",
    description: "Internal process adapter",
    labelKey: "adapterDisplay.process.label",
    descriptionKey: "adapterDisplay.process.description",
    icon: Cpu,
    comingSoon: true,
  },
  http: {
    label: "HTTP",
    description: "Internal HTTP adapter",
    labelKey: "adapterDisplay.http.label",
    descriptionKey: "adapterDisplay.http.description",
    icon: Cpu,
    comingSoon: true,
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function humanizeType(type: string): string {
  // Strip known type suffixes so "droid_local" → "Droid", not "Droid Local"
  let base = type;
  for (const suffix of Object.keys(TYPE_SUFFIXES)) {
    if (base.endsWith(suffix)) {
      base = base.slice(0, -suffix.length);
      break;
    }
  }
  return base.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getLocalizedMessage(key: string | undefined, fallback: string | undefined): string | undefined {
  if (!fallback) return undefined;
  if (!key) return fallback;
  const translated = translate(key);
  return translated === key ? fallback : translated;
}

export function getAdapterLabel(type: string): string {
  const known = adapterDisplayMap[type];
  const base =
    getLocalizedMessage(known?.labelKey, known?.label) ?? humanizeType(type);
  return withSuffix(base, getTypeSuffix(type));
}

export function getAdapterLabels(): Record<string, string> {
  const suffixed: Record<string, string> = {};
  for (const [type, info] of Object.entries(adapterDisplayMap)) {
    suffixed[type] = withSuffix(info.label, getTypeSuffix(type));
  }
  return suffixed;
}

export function getAdapterDisplay(type: string): AdapterDisplayInfo {
  const known = adapterDisplayMap[type];
  if (known) {
    return {
      ...known,
      label: getLocalizedMessage(known.labelKey, known.label) ?? known.label,
      description:
        getLocalizedMessage(known.descriptionKey, known.description) ??
        known.description,
      disabledLabel: getLocalizedMessage(
        known.disabledLabelKey,
        known.disabledLabel,
      ),
    };
  }

  const suffix = getTypeSuffix(type);
  const label = withSuffix(humanizeType(type), suffix);
  return {
    label,
    description: suffix ? `External ${suffix} adapter` : "External adapter",
    icon: Cpu,
  };
}

export function isKnownAdapterType(type: string): boolean {
  return type in adapterDisplayMap;
}
