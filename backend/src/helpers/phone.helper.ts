// Normalisation et validation des numéros de téléphone
// Supporte tous les pays africains + international (format E.164)

const RDC_PREFIX = '+243'

// Codes pays africains et internationaux courants
const COUNTRY_DIAL_CODES: Record<string, string> = {
  CD: '243',  // RDC Congo
  CM: '237',  // Cameroun
  NG: '234',  // Nigeria
  KE: '254',  // Kenya
  GH: '233',  // Ghana
  TZ: '255',  // Tanzanie
  UG: '256',  // Ouganda
  ZA: '27',   // Afrique du Sud
  SN: '221',  // Sénégal
  CI: '225',  // Côte d'Ivoire
  RW: '250',  // Rwanda
  ET: '251',  // Éthiopie
  ZM: '260',  // Zambie
  ZW: '263',  // Zimbabwe
  MW: '265',  // Malawi
  MZ: '258',  // Mozambique
  TN: '216',  // Tunisie
  MA: '212',  // Maroc
  DZ: '213',  // Algérie
  EG: '20',   // Égypte
  FR: '33',   // France
  GB: '44',   // Royaume-Uni
  US: '1',    // États-Unis/Canada
  BE: '32',   // Belgique
  GA: '241',  // Gabon
  CG: '242',  // Congo-Brazzaville
  AO: '244',  // Angola
  BJ: '229',  // Bénin
  BF: '226',  // Burkina Faso
  ML: '223',  // Mali
  NE: '227',  // Niger
  TD: '235',  // Tchad
  CF: '236',  // Centrafrique
}

/**
 * Normalise n'importe quel numéro en format E.164 (+XXXXXXXXXXX)
 * @param raw          Numéro brut (avec ou sans indicatif)
 * @param defaultIso   Code ISO 2 lettres du pays par défaut (ex: 'CD' pour RDC)
 * @returns            Numéro E.164 ou null si invalide
 */
export function normalizePhone(raw: string, defaultIso = 'CD'): string | null {
  if (!raw) return null

  // Supprimer espaces, tirets, parenthèses, points
  let cleaned = raw.replace(/[\s\-().]/g, '').trim()
  if (!cleaned) return null

  // 00XXXX → +XXXX
  if (cleaned.startsWith('00')) cleaned = '+' + cleaned.slice(2)

  // Déjà en E.164 : +XXXXXXXX
  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1).replace(/\D/g, '')
    // E.164 : 7 à 15 chiffres
    if (digits.length < 7 || digits.length > 15) return null
    return `+${digits}`
  }

  // Numéro sans indicatif → ajouter le pays par défaut
  const digits = cleaned.replace(/\D/g, '')
  if (!digits) return null

  const dialCode = COUNTRY_DIAL_CODES[defaultIso.toUpperCase()] ?? '243'

  // Le numéro commence déjà par l'indicatif (ex: 243XXXXXXXXX sans +)
  if (digits.startsWith(dialCode)) {
    const e164 = `+${digits}`
    return e164.length >= 8 && e164.length <= 16 ? e164 : null
  }

  // Retirer le 0 initial (convention locale : 0XXXXXXXXX → indicatif+XXXXXXXXX)
  const local = digits.startsWith('0') ? digits.slice(1) : digits
  const e164 = `+${dialCode}${local}`

  return e164.length >= 8 && e164.length <= 16 ? e164 : null
}

// ─── Fonctions spécifiques RDC (compatibilité ascendante) ────

const RDC_OPERATORS: Record<string, string[]> = {
  vodacom: ['081', '082', '083'],
  airtel:  ['099', '097', '098'],
  orange:  ['084', '085', '089'],
  africell: ['090', '091', '092'],
}

export const formatRdcPhone = (phone: string): string => {
  const normalized = normalizePhone(phone, 'CD')
  if (normalized) return normalized

  // Fallback legacy
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('243')) return `+${cleaned}`
  if (cleaned.startsWith('0') && cleaned.length === 10) return `${RDC_PREFIX}${cleaned.slice(1)}`
  if (cleaned.length === 9) return `${RDC_PREFIX}${cleaned}`
  return `+${cleaned}`
}

export const isValidRdcPhone = (phone: string): boolean => {
  const e164 = normalizePhone(phone, 'CD')
  return e164 !== null && /^\+243[0-9]{9}$/.test(e164)
}

export const getOperator = (phone: string): string | null => {
  const cleaned = phone.replace(/\D/g, '')
  const local = cleaned.startsWith('243') ? cleaned.slice(3) : cleaned
  const prefix = `0${local.substring(0, 2)}`

  for (const [operator, prefixes] of Object.entries(RDC_OPERATORS)) {
    if (prefixes.includes(prefix)) return operator
  }
  return null
}

export const maskPhone = (phone: string): string => {
  if (phone.length < 6) return '***'
  return `${phone.slice(0, 4)}****${phone.slice(-3)}`
}

/**
 * Normalise un tableau de numéros bruts — filtre les invalides
 * @returns { valid: string[], invalid: string[] }
 */
export function normalizePhoneList(
  raws: string[],
  defaultIso = 'CD'
): { valid: string[]; invalid: string[] } {
  const valid: string[] = []
  const invalid: string[] = []

  for (const raw of raws) {
    const normalized = normalizePhone(raw, defaultIso)
    if (normalized) valid.push(normalized)
    else invalid.push(raw)
  }

  return { valid, invalid }
}
