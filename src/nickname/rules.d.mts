export const NICK_MIN: number;
export const NICK_MAX: number;
export type NicknameIdentity = { fullName?: string; studentId?: string; email?: string };
export function normalise(s: string): string;
export function nicknameProblem(nickname: string, identity?: NicknameIdentity): string | null;
export function nicknameKey(nickname: string): string;
export function rollNickname(random?: () => number): string;
export function initialsOf(nickname: string): string;
