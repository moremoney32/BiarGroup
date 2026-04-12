// Chiffrement léger côté frontend — données sensibles en mémoire uniquement
// NB : ne JAMAIS stocker des données chiffrées en localStorage avec cette méthode

export const obfuscate = (value: string): string => {
  return btoa(encodeURIComponent(value))
}

export const deobfuscate = (value: string): string => {
  try {
    return decodeURIComponent(atob(value))
  } catch {
    return ''
  }
}

export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  const masked = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : '***'
  return `${masked}@${domain}`
}

export const maskPhone = (phone: string): string => {
  if (phone.length < 6) return '***'
  return `${phone.slice(0, 4)}****${phone.slice(-3)}`
}
