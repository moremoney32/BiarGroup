import DOMPurify from 'dompurify'

// SÉCURITÉ — toujours passer par ces helpers avant d'injecter du HTML

export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'br', 'p', 'a', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    FORBID_SCRIPTS: true,
  })
}

export const sanitizeRichHtml = (dirty: string): string => {
  // Pour les templates email — plus permissif mais toujours sécurisé
  return DOMPurify.sanitize(dirty, {
    FORBID_SCRIPTS: true,
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  })
}

export const stripHtml = (html: string): string => {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}
