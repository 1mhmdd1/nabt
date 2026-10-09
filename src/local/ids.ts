/** A UA ID is the 4-digit year the person joined, then 5 digits. No year before 2019. */

export function currentYear() {
  return new Date().getFullYear();
}

/** The join year, or null when the ID is not a UA ID. */
export function idYear(id: string): number | null {
  const raw = String(id || "").replace(/\D/g, "");
  if (!/^\d{9}$/.test(raw)) return null;
  const year = Number(raw.slice(0, 4));
  if (year < 2019 || year > currentYear()) return null;
  return year;
}

export function isUaId(id: string) {
  return idYear(id) != null;
}

export function joinedLabel(id: string) {
  const year = idYear(id);
  return year ? `Joined ${year}` : "";
}

