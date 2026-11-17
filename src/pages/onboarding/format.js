// 숫자·날짜 표시/계산 유틸. 날짜는 API 와 같은 'YYYY-MM-DD' 문자열로 다룬다.

export const fmtNumber = n => (n == null || n === '' ? '' : Number(n).toLocaleString('ko-KR'))
export const fmtWon = n => (n == null ? '—' : `${fmtNumber(Math.round(n))}원`)

const pad = n => String(n).padStart(2, '0')
export const toISO = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`
export const todayISO = () => { const d = new Date(); return toISO(d.getFullYear(), d.getMonth() + 1, d.getDate()) }

// 'YYYY-MM-DD' → '2023. 03. 15'
export const fmtDate = iso => (iso ? iso.replaceAll('-', '. ') : '')
export const fmtYearMonth = iso => (iso ? iso.slice(0, 7).replace('-', '.') : '')

export function isValidISO(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso ?? '')) return false
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

// 입력 중인 숫자 문자열을 '2023. 03. 15' 모양으로 맞춘다.
export function maskDate(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  const parts = [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean)
  return parts.join('. ')
}
export function parseMaskedDate(text) {
  const digits = text.replace(/\D/g, '')
  if (digits.length !== 8) return null
  const iso = toISO(digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8))
  return isValidISO(iso) ? iso : null
}

// iso 날짜에 n개월을 더한다. 말일이 없는 달이면 말일로 맞춘다(1/31 + 1개월 = 2/28).
export function addMonths(iso, n) {
  const [y, m, d] = iso.split('-').map(Number)
  const lastDay = new Date(y, m - 1 + n + 1, 0).getDate()
  const date = new Date(y, m - 1 + n, Math.min(d, lastDay))
  return toISO(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

// a → b 사이의 개월 수(일 단위는 버림). b 가 앞서면 음수.
export function diffMonths(a, b) {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return (by - ay) * 12 + (bm - am) - (bd < ad ? 1 : 0)
}
