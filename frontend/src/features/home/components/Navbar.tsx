import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sun, ChevronDown } from 'lucide-react'
import logoFull from '../../../assets/img_banner_1.png'

const links = [
  { label: 'Accueil', href: '#accueil' },
  { label: 'Services', href: '#services' },
  { label: 'Fonctionnalités', href: '#fonctionnalites', sub: ['Call Center', 'SMS Bulk', 'WhatsApp', 'Email'] },
  { label: 'Industries', href: '#industries' },
  { label: 'Tarifs', href: '#tarifs' },
  { label: 'Actualités', href: '#actualites', sub: ['Blog', 'Communiqués', 'Événements'] },
  { label: 'À propos', href: '#apropos' },
  { label: 'Contact', href: '#contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [dropdown, setDropdown] = useState<string | null>(null)

  useEffect(() => {
    const close = () => setDropdown(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_1px_0_0_#e5e7eb]">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-6">

        {/* Logo — vrai logo ACTOR Hub extrait du Figma */}
        <a href="/" className="shrink-0">
          <img src={logoFull} alt="ACTOR Hub" className="h-9 w-auto object-contain" />
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 xl:flex">
          {links.map((link) => (
            <div key={link.label} className="relative">
              {link.sub ? (
                <button
                  onClick={(e) => { e.stopPropagation(); setDropdown(dropdown === link.label ? null : link.label) }}
                  className="flex items-center gap-0.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-[#374151] hover:text-[#FE5B29] transition-colors"
                >
                  {link.label}
                  <ChevronDown size={12} className={`transition-transform duration-200 ${dropdown === link.label ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <a href={link.href} className="rounded-md px-2.5 py-2 text-[13px] font-medium text-[#374151] hover:text-[#FE5B29] transition-colors">
                  {link.label}
                </a>
              )}

              <AnimatePresence>
                {link.sub && dropdown === link.label && (
                  <motion.ul
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 top-full z-50 mt-1.5 min-w-[160px] overflow-hidden rounded-xl border border-gray-100 bg-white py-1.5 shadow-xl"
                  >
                    {link.sub.map((s) => (
                      <li key={s}>
                        <a href="#" className="block px-4 py-2 text-[13px] text-[#374151] hover:bg-orange-50 hover:text-[#FE5B29]">{s}</a>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        {/* Right */}
        <div className="hidden items-center gap-3 xl:flex">
          <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600" aria-label="Thème">
            <Sun size={17} />
          </button>
          <a href="/login" className="text-[13px] font-medium text-[#374151] hover:text-[#FE5B29] transition-colors">
            Connexion
          </a>
          <motion.a
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            href="/register"
            className="rounded-lg bg-[#FE5B29] px-4 py-2 text-[13px] font-bold text-white shadow-sm hover:bg-[#E0521F] transition-colors"
          >
            Essai gratuit
          </motion.a>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="rounded-lg p-2 text-gray-600 xl:hidden" aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-gray-100 bg-white xl:hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-4">
              {links.map((link) => (
                <a key={link.label} href={link.href} onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-[14px] font-medium text-[#374151] hover:bg-orange-50 hover:text-[#FE5B29]">
                  {link.label}
                </a>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3">
                <a href="/login" className="py-2 text-center text-[14px] font-medium text-[#374151]">Connexion</a>
                <a href="/register" className="rounded-lg bg-[#FE5B29] py-3 text-center text-[14px] font-bold text-white">
                  Essai gratuit
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
