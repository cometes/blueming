export function convertToUnderscore(input: string): string {
  return input.replace(/\s+/g, "_"); // 모든 공백을 _로 변환
}
