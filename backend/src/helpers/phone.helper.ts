// Helpers spécifiques aux numéros RDC Congo (+243)

const RDC_PREFIX = '+243'
const RDC_OPERATORS = {
  vodacom: ['081', '082', '083'],
  airtel: ['099', '097', '098'],
  orange: ['084', '085', '089'],
  africell: ['090', '091', '092'],
}

export const formatRdcPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.startsWith('243')) return `+${cleaned}`
  if (cleaned.startsWith('0') && cleaned.length === 10) return `${RDC_PREFIX}${cleaned.slice(1)}`
  if (cleaned.length === 9) return `${RDC_PREFIX}${cleaned}`

  return `+${cleaned}`
}

export const isValidRdcPhone = (phone: string): boolean => {
  const e164 = formatRdcPhone(phone)
  return /^\+243[0-9]{9}$/.test(e164)
}

export const getOperator = (phone: string): string | null => {
  const cleaned = phone.replace(/\D/g, '')
  const local = cleaned.startsWith('243') ? cleaned.slice(3) : cleaned
  const prefix = local.substring(0, 3)

  for (const [operator, prefixes] of Object.entries(RDC_OPERATORS)) {
    if (prefixes.includes(`0${prefix.slice(0, 2)}`)) return operator
  }
  return null
}

export const maskPhone = (phone: string): string => {
  if (phone.length < 6) return '***'
  return `${phone.slice(0, 4)}****${phone.slice(-3)}`
}
