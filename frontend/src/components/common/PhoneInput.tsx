import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { isValidPhoneNumber, getCountryCallingCode, type CountryCode } from 'libphonenumber-js'

// ── 54 pays africains ─────────────────────────────────────────────────────────
const AFRICAN_COUNTRIES: { code: CountryCode; name: string }[] = [
  { code: 'ZA', name: 'Afrique du Sud' },
  { code: 'DZ', name: 'Algérie' },
  { code: 'AO', name: 'Angola' },
  { code: 'BJ', name: 'Bénin' },
  { code: 'BW', name: 'Botswana' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'BI', name: 'Burundi' },
  { code: 'CV', name: 'Cap-Vert' },
  { code: 'CM', name: 'Cameroun' },
  { code: 'CF', name: 'Centrafrique' },
  { code: 'KM', name: 'Comores' },
  { code: 'CG', name: 'Congo' },
  { code: 'CD', name: 'RD Congo' },
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'DJ', name: 'Djibouti' },
  { code: 'EG', name: 'Égypte' },
  { code: 'ER', name: 'Érythrée' },
  { code: 'ET', name: 'Éthiopie' },
  { code: 'GA', name: 'Gabon' },
  { code: 'GM', name: 'Gambie' },
  { code: 'GH', name: 'Ghana' },
  { code: 'GN', name: 'Guinée' },
  { code: 'GQ', name: 'Guinée Équatoriale' },
  { code: 'GW', name: 'Guinée-Bissau' },
  { code: 'KE', name: 'Kenya' },
  { code: 'LS', name: 'Lesotho' },
  { code: 'LR', name: 'Libéria' },
  { code: 'LY', name: 'Libye' },
  { code: 'MG', name: 'Madagascar' },
  { code: 'MW', name: 'Malawi' },
  { code: 'ML', name: 'Mali' },
  { code: 'MA', name: 'Maroc' },
  { code: 'MU', name: 'Maurice' },
  { code: 'MR', name: 'Mauritanie' },
  { code: 'MZ', name: 'Mozambique' },
  { code: 'NA', name: 'Namibie' },
  { code: 'NE', name: 'Niger' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'UG', name: 'Ouganda' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'ST', name: 'São Tomé-et-Príncipe' },
  { code: 'SN', name: 'Sénégal' },
  { code: 'SC', name: 'Seychelles' },
  { code: 'SL', name: 'Sierra Leone' },
  { code: 'SO', name: 'Somalie' },
  { code: 'SD', name: 'Soudan' },
  { code: 'SS', name: 'Soudan du Sud' },
  { code: 'SZ', name: 'Eswatini' },
  { code: 'TZ', name: 'Tanzanie' },
  { code: 'TD', name: 'Tchad' },
  { code: 'TG', name: 'Togo' },
  { code: 'TN', name: 'Tunisie' },
  { code: 'ZM', name: 'Zambie' },
  { code: 'ZW', name: 'Zimbabwe' },
]

// Génère l'emoji drapeau depuis le code ISO2 (ex: "CD" → "🇨🇩")
function flag(code: string) {
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join('')
}

interface PhoneInputProps {
  value: string
  onChange: (val: string) => void
  error?: string
}

export function PhoneInput({ value, onChange, error }: PhoneInputProps) {
  const [country, setCountry] = useState<CountryCode>('CD')
  const [digits, setDigits] = useState('')
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const dialCode = getCountryCallingCode(country)

  // Restaurer depuis la valeur du formulaire (retour arrière)
  useEffect(() => {
    if (value && value.startsWith('+')) {
      const prefix = `+${dialCode}`
      if (value.startsWith(prefix)) {
        setDigits(value.slice(prefix.length))
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fermer si clic en dehors
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Focus sur la recherche quand le dropdown s'ouvre
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50)
    }
  }, [open])

  const fullNumber = digits ? `+${dialCode}${digits}` : ''
  const isValid = fullNumber ? isValidPhoneNumber(fullNumber, country) : null

  const handleDigits = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    setDigits(raw)
    onChange(raw ? `+${dialCode}${raw}` : '')
  }

  const handleCountrySelect = (code: CountryCode) => {
    setCountry(code)
    setDigits('')
    onChange('')
    setOpen(false)
    setSearch('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const filtered = AFRICAN_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      `+${getCountryCallingCode(c.code)}`.includes(search)
  )

  return (
    <div ref={containerRef} className="relative">
      {/* ── Champ principal ── */}
      <div className={`flex items-stretch overflow-hidden rounded-xl border bg-white transition-all ${
        error
          ? 'border-red-400 ring-2 ring-red-400/20'
          : isValid === true
          ? 'border-green-400 ring-2 ring-green-400/20'
          : 'border-[#e2e8f0] focus-within:border-[#5906ae] focus-within:ring-2 focus-within:ring-[#5906ae]/10'
      }`}>

        {/* Bouton drapeau */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex shrink-0 items-center gap-1.5 border-r border-[#e2e8f0] bg-[#fafafa] px-3 hover:bg-[#f0ebff] transition-colors"
        >
          {/* Pastille drapeau — fond violet pâle pour que les lettres soient visibles sur Windows */}
          <span
            className="flex h-7 w-8 items-center justify-center rounded-md bg-[#f0ebff]"
            style={{
              fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
              fontSize: '18px',
              lineHeight: 1,
              color: '#5906ae',          // violet → les lettres ZA/CM sont visibles sur Windows
              fontWeight: 700,
            }}
          >
            {flag(country)}
          </span>
          <span className="text-[13px] font-semibold text-[#1a0033]">
            +{dialCode}
          </span>
          <ChevronDown
            size={12}
            className={`text-[#9ca3af] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Input chiffres */}
        <div className="flex flex-1 items-center">
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            value={digits}
            onChange={handleDigits}
            placeholder="81 234 5678"
            className="w-full bg-transparent py-3 pl-3 pr-8 text-[14px] text-[#1a0033] outline-none placeholder:text-[#1a0033]/30"
          />
          {isValid === true && (
            <Check size={14} className="mr-3 shrink-0 text-green-500" />
          )}
        </div>
      </div>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-2xl">

          {/* Barre de recherche */}
          <div className="border-b border-[#e2e8f0] px-3 py-2.5">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un pays ou indicatif..."
              className="w-full bg-transparent text-[13px] text-[#1a0033] outline-none placeholder:text-[#9ca3af]"
            />
          </div>

          {/* Liste des pays */}
          <ul className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-[13px] text-[#9ca3af]">Aucun résultat</li>
            ) : (
              filtered.map((c) => {
                const isSelected = c.code === country
                return (
                  <li key={c.code}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleCountrySelect(c.code)
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#f5f0ff] ${
                        isSelected ? 'bg-[#f5f0ff]' : ''
                      }`}
                    >
                      {/* Drapeau */}
                      <span
                        className="flex h-7 w-8 shrink-0 items-center justify-center rounded-md bg-[#f0ebff]"
                        style={{
                          fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
                          fontSize: '16px',
                          lineHeight: 1,
                          color: '#5906ae',
                          fontWeight: 700,
                        }}
                      >
                        {flag(c.code)}
                      </span>

                      {/* Nom du pays */}
                      <span className={`flex-1 text-[13px] font-medium ${isSelected ? 'text-[#5906ae]' : 'text-[#1a0033]'}`}>
                        {c.name}
                      </span>

                      {/* Indicatif */}
                      <span className="text-[12px] font-semibold text-[#5906ae]">
                        +{getCountryCallingCode(c.code)}
                      </span>

                      {/* Coche si sélectionné */}
                      {isSelected && (
                        <Check size={13} className="shrink-0 text-[#5906ae]" />
                      )}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
