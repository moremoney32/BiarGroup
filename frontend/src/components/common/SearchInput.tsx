import { Search, X } from 'lucide-react'
import { useRef } from 'react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function SearchInput({
  value, onChange, placeholder = 'Rechercher...', className = '',
}: SearchInputProps) {
  const ref = useRef<HTMLInputElement>(null)

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search size={15} className="absolute left-3 text-white/30" />
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-8 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#E91E8C]/50"
      />
      {value && (
        <button
          onClick={() => { onChange(''); ref.current?.focus() }}
          className="absolute right-2 rounded p-0.5 text-white/30 hover:text-white"
          aria-label="Effacer"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
