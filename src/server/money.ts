/** 1 NGN = 100 kobo. Bachs speaks decimal naira strings; the ledger stores kobo. */
export const KOBO_PER_NAIRA = 100;
export const KOBO_PER_CREDIT = 100;
export const ROOM_FEE_KOBO = 1000;
export const PLUS_PRICE_KOBO = 200_000;
export const BACHS_MIN_NGN_KOBO = 10_000;

export function koboToNairaString(kobo: number): string {
  if (!Number.isInteger(kobo)) throw new Error("kobo must be an integer");
  const sign = kobo < 0 ? "-" : "";
  const abs = Math.abs(kobo);
  const naira = Math.floor(abs / 100);
  const cents = String(abs % 100).padStart(2, "0");
  return `${sign}${naira}.${cents}`;
}

export function nairaStringToKobo(amount: string): number {
  if (!/^-?\d+\.\d{2}$/.test(amount)) {
    throw new Error("amount must be a decimal string with 2 places");
  }
  const negative = amount.startsWith("-");
  const [naira, cents] = amount.replace("-", "").split(".");
  const kobo = Number(naira) * 100 + Number(cents);
  if (!Number.isSafeInteger(kobo)) throw new Error("amount is out of range");
  return negative ? -kobo : kobo;
}

export function formatNaira(kobo: number): string {
  const negative = kobo < 0;
  const abs = Math.abs(kobo);
  const naira = Math.floor(abs / 100);
  const cents = abs % 100;
  const grouped = naira.toLocaleString("en-NG");
  const body = cents === 0 ? grouped : `${grouped}.${String(cents).padStart(2, "0")}`;
  return `${negative ? "-" : ""}₦${body}`;
}

export function creditsFromKobo(kobo: number): number {
  return kobo / KOBO_PER_CREDIT;
}
