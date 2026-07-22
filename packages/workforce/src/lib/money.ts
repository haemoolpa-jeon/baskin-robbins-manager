/** Korean Won with thousands separators, e.g. 10320 -> "10,320원". */
export function won(n: number): string {
  return `${Math.round(n).toLocaleString('ko-KR')}원`
}
