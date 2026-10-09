/** Local stand-in for Firestore Timestamp. Stored as { __ts } in AsyncStorage. */
export class Timestamp {
  constructor(public ms: number) {}
  toMillis() {
    return this.ms;
  }
  toDate() {
    return new Date(this.ms);
  }
  static now() {
    return new Timestamp(Date.now());
  }
  static fromMillis(ms: number) {
    return new Timestamp(ms);
  }
  static fromDate(d: Date) {
    return new Timestamp(d.getTime());
  }
}

export function isTimestamp(v: unknown): v is Timestamp {
  return v instanceof Timestamp;
}
