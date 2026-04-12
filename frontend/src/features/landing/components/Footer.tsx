import { motion } from 'framer-motion'
import { MapPin, Phone, Mail } from 'lucide-react'

const solutions = ['Centre d\'Appels Cloud', 'SMS Marketing', 'WhatsApp Business', 'Email Marketing']
const entreprise = ['À propos', 'Actualités', 'Tarifs', 'Contact', 'Commencer']

export default function Footer() {
  return (
    <footer className="bg-[#0a0b0b] pt-16">
      <div className="mx-auto max-w-[1087px] px-4">
        <div className="grid gap-10 pb-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#E91E8C] to-[#3B2F8F]">
                <span className="text-sm font-black text-white">B</span>
              </div>
              <span className="text-[14px] font-medium text-[#d1d5dc]">Actor Hub</span>
            </div>
            <p className="mb-6 max-w-sm text-[16px] leading-relaxed text-[#99a1af]">
              Plateforme SaaS complète de communication multi-canal pour entreprises. Centre d'appels cloud, SMS Bulk, WhatsApp Business et Email Marketing.
            </p>
            <div className="flex flex-col gap-2 text-[14px] text-[#99a1af]">
              <span className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0 text-[#E91E8C]" />
                5 Rue Gemena, Quartier Haut commandement<br />
                Gombe, Kinshasa / RDCONGO — BP: 12345
              </span>
              <a href="tel:+243978979898" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone size={14} className="text-[#E91E8C]" /> +243 978 979 898
              </a>
              <a href="tel:+243822724146" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone size={14} className="text-[#E91E8C]" /> +243 822 724 146
              </a>
              <a href="mailto:contact@biargroup.com" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail size={14} className="text-[#E91E8C]" /> contact@biargroup.com
              </a>
            </div>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="mb-4 text-[18px] font-semibold text-white">Solutions</h4>
            <ul className="flex flex-col gap-2.5">
              {solutions.map((s) => (
                <li key={s}>
                  <a href="#" className="text-[14px] text-[#99a1af] hover:text-white transition-colors">
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <h4 className="mb-4 text-[18px] font-semibold text-white">Entreprise</h4>
            <ul className="flex flex-col gap-2.5">
              {entreprise.map((e) => (
                <li key={e}>
                  <a href="#" className="text-[14px] text-[#99a1af] hover:text-white transition-colors">
                    {e}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 py-5 text-[14px] text-[#99a1af]">
          <span>© 2026 Actor Hub. Tous droits réservés. • Pour vous, on se dépasse.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-white transition-colors">CGU</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
