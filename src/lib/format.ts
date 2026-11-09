const TZ = "Asia/Jakarta";
const WIB_OFFSET_MS = 7 * 3600 * 1000;

export function formatShortDate(value: string | Date) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  });
}

export function formatLongDate(value: string | Date) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  });
}

export function formatTimeWib(value: string | Date) {
  const time = new Date(value).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  });
  return `${time.replace(".", ":")} WIB`;
}

/** Awal bulan berjalan (00:00 WIB tanggal 1) dalam UTC. */
export function startOfMonthWIB(now: Date = new Date()) {
  const wib = new Date(now.getTime() + WIB_OFFSET_MS);
  return new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), 1) - WIB_OFFSET_MS);
}

export function timeAgo(value: string | Date, now: Date = new Date()) {
  const seconds = Math.max(0, Math.floor((now.getTime() - new Date(value).getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (seconds < 60) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 30) return `${days} hari lalu`;
  return formatShortDate(value);
}

export function formatDateTimeWib(value: string | Date) {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  });
}

// ---------- Rentang laporan (harian / mingguan / bulanan, zona WIB) ----------
export type RangeKind = "day" | "week" | "month";
const DAY_MS = 86_400_000;

/** ms yang merepresentasikan tanggal WIB sebagai UTC, jadi "YYYY-MM-DD". */
function ymd(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function todayWIB(now: Date = new Date()) {
  return ymd(now.getTime() + WIB_OFFSET_MS);
}

/** Validasi parameter tanggal dari URL; salah format -> hari ini. */
export function parseDateParam(value: string | undefined, now: Date = new Date()) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const ms = Date.parse(`${value}T00:00:00Z`);
    if (!Number.isNaN(ms) && ymd(ms) === value) return value;
  }
  return todayWIB(now);
}

export function parseRangeKind(value: string | undefined): RangeKind {
  return value === "week" || value === "month" ? value : "day";
}

export function rangeFor(kind: RangeKind, dateStr: string) {
  const base = Date.parse(`${dateStr}T00:00:00Z`);
  const fmt = (ms: number, o: Intl.DateTimeFormatOptions) =>
    new Date(ms).toLocaleDateString("id-ID", { ...o, timeZone: "UTC" });

  let fromW: number;
  let toW: number;
  let prev: string;
  let next: string;
  let label: string;

  if (kind === "day") {
    fromW = base;
    toW = base + DAY_MS;
    prev = ymd(base - DAY_MS);
    next = ymd(base + DAY_MS);
    label = fmt(base, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  } else if (kind === "week") {
    const dow = new Date(base).getUTCDay(); // 0 = Minggu; minggu dimulai Senin
    fromW = base - ((dow + 6) % 7) * DAY_MS;
    toW = fromW + 7 * DAY_MS;
    prev = ymd(fromW - 7 * DAY_MS);
    next = ymd(fromW + 7 * DAY_MS);
    label = `${fmt(fromW, { day: "numeric", month: "short" })} – ${fmt(toW - DAY_MS, {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  } else {
    const d = new Date(base);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    fromW = Date.UTC(y, m, 1);
    toW = Date.UTC(y, m + 1, 1);
    prev = ymd(Date.UTC(y, m - 1, 1));
    next = ymd(toW);
    label = fmt(fromW, { month: "long", year: "numeric" });
  }

  const days: string[] = [];
  for (let t = fromW; t < toW; t += DAY_MS) days.push(ymd(t));

  return {
    from: new Date(fromW - WIB_OFFSET_MS),
    to: new Date(toW - WIB_OFFSET_MS),
    label,
    prev,
    next,
    days,
  };
}

/** Jam saja dalam WIB, mis. "08:02". */
export function formatClock(value: string | Date) {
  return new Date(value)
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ })
    .replace(".", ":");
}

/** Durasi dalam milidetik menjadi "8j 02m". */
export function formatDuration(ms: number) {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  return `${Math.floor(minutes / 60)}j ${String(minutes % 60).padStart(2, "0")}m`;
}
