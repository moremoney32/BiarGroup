import { formatPhone, formatDuration, formatPercent } from '../../helpers/format'
import { maskEmail, maskPhone } from '../../helpers/encryption'

describe('format.ts', () => {
  describe('formatPhone', () => {
    it('formate un numéro RDC', () => {
      expect(formatPhone('+243810000001')).toBe('+243 81 000 0001')
    })
  })

  describe('formatDuration', () => {
    it('formate 142 secondes', () => {
      expect(formatDuration(142)).toBe('02:22')
    })

    it('formate 0 secondes', () => {
      expect(formatDuration(0)).toBe('00:00')
    })
  })

  describe('formatPercent', () => {
    it('calcule le pourcentage', () => {
      expect(formatPercent(48, 100)).toBe('48%')
    })

    it('retourne 0% si total est 0', () => {
      expect(formatPercent(5, 0)).toBe('0%')
    })
  })
})

describe('encryption.ts', () => {
  describe('maskEmail', () => {
    it('masque la partie locale', () => {
      expect(maskEmail('john@example.com')).toMatch(/@example\.com$/)
    })
  })

  describe('maskPhone', () => {
    it('masque les chiffres du milieu', () => {
      expect(maskPhone('+243810000001')).toContain('****')
    })
  })
})
