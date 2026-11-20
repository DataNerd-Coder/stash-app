/** kobo (database) -> naira (API). Postgres sums come back as strings, so accept those too. */
export const toNaira = (kobo: number | string | null | undefined): number => Number(kobo ?? 0) / 100;

/** naira (API input) -> kobo (database), rounded to whole kobo. */
export const toKobo = (naira: number): number => Math.round(naira * 100);

export const num = (v: number | string | null | undefined): number => Number(v ?? 0);
