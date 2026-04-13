import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, X, Loader2 } from 'lucide-react'

interface ComboboxProps {
  options: string[]
  value: string
  onChange: (val: string) => void
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  minChars?: number
  className?: string
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Rechercher...',
  disabled = false,
  loading = false,
  minChars = 2,
  className = '',
}: ComboboxProps) {
  // query = ce que l'utilisateur voit dans l'input (local, jamais piloté par RHF)
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Si la valeur externe change (ex: reset du formulaire), on sync
  useEffect(() => {
    setQuery(value)
  }, [value])

  // Fermer si clic en dehors
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
        // Si l'user a tapé sans rien sélectionner → on remet la valeur validée
        setQuery(value)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [value])

  // Filtrage 100% local — synchrone — zéro async — zéro saut de curseur
  const filtered =
    query.length >= minChars
      ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase())).slice(0, 60)
      : []

  const handleSelect = useCallback(
    (opt: string) => {
      onChange(opt)
      setQuery(opt)
      setOpen(false)
    },
    [onChange]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setOpen(true)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (query.length >= minChars) setOpen(true) }}
          disabled={disabled || loading}
          placeholder={loading ? 'Chargement...' : placeholder}
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-xl border border-[#e2e8f0] bg-white py-3 pl-4 pr-9 text-[14px] text-[#1a0033] outline-none placeholder:text-[#1a0033]/30 focus:border-[#5906ae] focus:ring-2 focus:ring-[#5906ae]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 size={14} className="animate-spin text-[#5906ae]" />
          ) : query ? (
            // pointer-events-auto uniquement sur le X pour pouvoir cliquer
            <button
              type="button"
              onMouseDown={handleClear}
              className="pointer-events-auto text-[#9ca3af] hover:text-[#1a0033] transition-colors"
            >
              <X size={14} />
            </button>
          ) : (
            <ChevronDown size={14} className="text-[#9ca3af]" />
          )}
        </div>
      </div>

      {open && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-[#e2e8f0] bg-white shadow-xl max-h-52 overflow-y-auto">
          {query.length < minChars ? (
            <p className="px-4 py-3 text-[13px] text-[#9ca3af]">
              Tapez {minChars} lettres pour rechercher...
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-4 py-3 text-[13px] text-[#9ca3af]">Aucun résultat</p>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                // onMouseDown + preventDefault empêche le blur de l'input avant le clic
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(opt)
                }}
                className={`w-full px-4 py-2.5 text-left text-[14px] transition-colors hover:bg-[#f5f0ff] ${
                  opt === value
                    ? 'bg-[#f5f0ff] font-medium text-[#5906ae]'
                    : 'text-[#1a0033]'
                }`}
              >
                {opt}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
