/** Accommodation requests are hard-deleted 30 days after the event ends. */
export const ACCOMMODATION_KEEP_MS = 30 * 24 * 60 * 60 * 1000;

export function accommodationDeleteAt(eventEndMs: number): number {
  return eventEndMs + ACCOMMODATION_KEEP_MS;
}
