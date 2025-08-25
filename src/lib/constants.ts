export const SPORTS_CLASS_CODES = ["407", "507", "607"] as const;
export type SportsClassCode = (typeof SPORTS_CLASS_CODES)[number];

export const SPORTS_CLASS_SET = new Set<string>(SPORTS_CLASS_CODES);

export function isSportsClass(classCode: string): boolean {
  return SPORTS_CLASS_SET.has(classCode);
}

export function promoteClassCode(classCode: string): string {
  if (!/^[456]0[1-9]$/.test(classCode)) return classCode;
  const grade = Number(classCode[0]);
  if (grade >= 6) return classCode;
  return `${grade + 1}${classCode.slice(1)}`;
}

export function promoteSportsClassCode(classCode: string): string {
  return isSportsClass(classCode) ? promoteClassCode(classCode) : classCode;
}
