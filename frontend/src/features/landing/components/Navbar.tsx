import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sun, Moon, ChevronDown, Phone } from 'lucide-react'

const navLinks = [
  { label: 'Accueil', href: '#accueil' },
  { label: 'Services', href: '#services' },
  {
    label: 'Fonctionnalités',
    href: '#fonctionnalites',
    children: ['Call Center', 'SMS Bulk', 'WhatsApp', 'Email Marketing'],
  },
  { label: 'Industries', href: '#industries' },
  { label: 'Tarifs', href: '#tarifs' },
  {
    label: 'Actualités',
    href: '#actualites',
    children: ['Blog', 'Communiqués', 'Événements'],
  },
  { label: 'À propos', href: '#apropos' },
  { label: 'Contact', href: '#contact' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // close dropdown on outside click
  useEffect(() => {
    const handle = () => setOpenDropdown(null)
    window.addEventListener('click', handle)
    return () => window.removeEventListener('click', handle)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="mx-auto flex h-[64px] max-w-[1200px] items-center justify-between px-4">

        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          {/* Signal bars icon */}
          <div className="flex items-end gap-[3px] h-7">
            {[12, 16, 20, 24, 28].map((h, i) => (
              <div
                key={i}
                className="w-[4px] rounded-sm"
                style={{
                  height: h,
                  background: `linear-gradient(180deg, #FF6B35 0%, #E91E8C 100%)`,
                }}
              />
            ))}
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-[20px] font-extrabold tracking-tight text-[#1a1a2e]">ACTOR</span>
            <span className="text-[13px] font-semibold text-[#6b7280]">hub</span>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 xl:flex">
          {navLinks.map((link) => (
            <div key={link.label} className="relative">
              {link.children ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenDropdown(openDropdown === link.label ? null : link.label)
                  }}
                  className="flex items-center gap-0.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-[#374151] hover:bg-gray-50 hover:text-[#F97316] transition-colors"
                >
                  {link.label}
                  <ChevronDown size={13} className={`transition-transform ${openDropdown === link.label ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <a
                  href={link.href}
                  className="rounded-md px-2.5 py-1.5 text-[13px] font-medium text-[#374151] hover:bg-gray-50 hover:text-[#F97316] transition-colors"
                >
                  {link.label}
                </a>
              )}

              <AnimatePresence>
                {link.children && openDropdown === link.label && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-0 top-full mt-1 min-w-[160px] rounded-xl border border-gray-100 bg-white py-2 shadow-lg"
                  >
                    {link.children.map((child) => (
                      <a
                        key={child}
                        href="#"
                        className="block px-4 py-2 text-[13px] text-[#374151] hover:bg-orange-50 hover:text-[#F97316]"
                      >
                        {child}
                      </a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden items-center gap-3 xl:flex">
          {/* Theme toggle */}
          <button
            onClick={() => setDark(!dark)}
            className="rounded-lg p-1.5 text-[#6b7280] hover:bg-gray-100"
            aria-label="Thème"
          >
            {dark ? <Moon size={17} /> : <Sun size={17} />}
          </button>

          <a href="/login" className="text-[13px] font-medium text-[#374151] hover:text-[#F97316] transition-colors">
            Connexion
          </a>

          <motion.a
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            href="/register"
            className="rounded-lg bg-[#F97316] px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-[#EA6C0A] transition-colors"
          >
            Essai gratuit
          </motion.a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-[#374151] xl:hidden"
          aria-label="Menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-gray-100 bg-white xl:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-[14px] font-medium text-[#374151] hover:bg-orange-50 hover:text-[#F97316]"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3">
                <a href="/login" className="text-center text-[14px] font-medium text-[#374151]">Connexion</a>
                <a href="/register" className="rounded-lg bg-[#F97316] py-2.5 text-center text-[14px] font-semibold text-white">
                  Essai gratuit
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
