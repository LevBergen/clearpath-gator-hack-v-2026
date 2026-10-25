import type { Field } from "./types";

export function fieldError(field: Field, value: string): string | null {
  if (!value.trim())
    return field.required ? "This question still needs your answer." : null;
  if (field.kind !== "long" && /[\r\n]/.test(value))
    return "Use a single line for this answer.";
  if (field.maxLength && value.length > field.maxLength)
    return `Use ${field.maxLength} characters or fewer.`;
  if (value.length > 6000) return "Use 6,000 characters or fewer.";
  if (
    field.kind === "email" &&
    (value !== value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
  )
    return "Enter a complete email address.";
  if (
    field.kind === "number" &&
    (!/^\d+(?:\.\d{1,2})?$/.test(value.trim()) ||
      !Number.isFinite(Number(value)) ||
      Number(value) < 0)
  )
    return "Enter a nonnegative amount, with up to two decimal places.";
  return null;
}
