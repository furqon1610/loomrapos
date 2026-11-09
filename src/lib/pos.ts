export const PAYMENT_METHODS = [
  { id: "cash", label: "Tunai" },
  { id: "qris", label: "QRIS" },
  { id: "debit", label: "Debit" },
  { id: "transfer", label: "Transfer" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["id"];

export const PAYMENT_LABEL: Record<string, string> = Object.fromEntries(
  PAYMENT_METHODS.map((m) => [m.id, m.label]),
);

export const LOW_STOCK_THRESHOLD = 5;

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
