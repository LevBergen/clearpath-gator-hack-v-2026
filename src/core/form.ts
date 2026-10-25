import type { Application, Field } from "./types";

function guide(label: string, kind: Field["kind"]): string {
  if (kind === "email") return "The email address where you want to hear back.";
  if (kind === "number")
    return "Enter the amount as a number. Use the currency requested by the form.";
  if (/name/i.test(label)) return "Use the name you want on this application.";
  return `Answer in your own words. Include only details you know are accurate.`;
}

export function parseForm(text: string): Application {
  if (!text.trim())
    throw new Error("Paste at least one question to get started.");
  if (text.length > 16000)
    throw new Error("Keep your form under 16,000 characters.");
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const looksLikeQuestion = (s: string) =>
    /^(?:\d+[.)]|[-*]\s)|[?:*]$|\b(?:name|email|address|phone)\b/i.test(s);
  const hasTitle = lines.length > 1 && !looksLikeQuestion(lines[0]);
  const title = hasTitle
    ? lines
        .shift()!
        .replace(/^#+\s*/, "")
        .slice(0, 160)
    : "My application";
  if (lines.length > 30)
    throw new Error("Import up to 30 questions at a time.");
  const fields: Field[] = lines.map((line, index) => {
    const optional = /\(optional\)|\[optional\]/i.test(line);
    const limit = line.match(
      /\(\s*(?:max(?:imum)?\s*)?(\d+)\s*characters?\s*\)/i,
    );
    const label = line
      .replace(/^\s*(?:\d+[.)]\s*|[-*]\s+)/, "")
      .replace(/\(optional\)|\[optional\]/gi, "")
      .replace(/\(\s*(?:max(?:imum)?\s*)?\d+\s*characters?\s*\)/gi, "")
      .replace(/[:*\s]+$/, "")
      .trim();
    if (!label || label.length > 800)
      throw new Error("Each question needs a label under 800 characters.");
    const narrative =
      /\b(?:describe|explain|tell us|statement|why|anything else|how (?:will|would|do|does|did))\b/i.test(
        label,
      );
    const kind: Field["kind"] = narrative
      ? "long"
      : /^(?:your |university |contact |preferred )?e-?mail(?: address)?\??$/i.test(
            label,
          )
        ? "email"
        : /^(?:(?:requested |total |your )?(?:amount|budget)(?: requested)?|how much(?: are you requesting)?)\??$/i.test(
              label,
            )
          ? "number"
          : /\?/.test(label)
            ? "long"
            : "short";
    return {
      id: `field-${index + 1}`,
      label,
      required: !optional,
      kind,
      plainLanguage: guide(label, kind),
      ...(limit ? { maxLength: Math.min(Number(limit[1]), 6000) } : {}),
    };
  });
  return {
    id: `import-${Date.now()}`,
    title,
    description:
      "Imported by you. Check that every question and requirement matches the original form.",
    fields,
  };
}
