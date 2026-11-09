/** Hanya angka, tanpa nol di depan ("007" -> "7"). */
export function onlyDigits(value: string, maxDigits = 12) {
  return value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, maxDigits);
}

/** "5000" -> "5.000" (pemisah ribuan gaya Indonesia). */
export function formatThousands(digits: string) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
