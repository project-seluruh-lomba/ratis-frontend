export function getWhatsappDigits(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return ''
  return digits.startsWith('62') ? digits : `62${digits.replace(/^0/, '')}`
}

export function formatWhatsappNumber(phone: string) {
  const digits = getWhatsappDigits(phone)
  if (!digits) return '-'
  const local = digits.slice(2)
  return `+62 ${local.slice(0, 3)}-${local.slice(3, 7)}-${local.slice(7)}`
}
