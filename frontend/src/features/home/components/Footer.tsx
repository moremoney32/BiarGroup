import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, Youtube } from 'lucide-react'
import logoFull from '../../../assets/img_wide_1.png'

const solutions = [
  'Centre d\'Appels Cloud',
  'SMS Marketing',
  'WhatsApp Business',
  'Email Marketing',
]

const company = ['À propos', 'Actualités', 'Tarifs', 'Contact', 'Commencer']

export default function Footer() {
  return (
    <footer className="bg-[#0f0f1a] text-white">
      <div className="mx-auto max-w-[1200px] px-4 py-14">
        <div className="grid gap-10 md:grid-cols-3">

          {/* Brand */}
          <div className="md:col-span-1">
            <img src={logoFull} alt="ACTOR Hub" className="h-8 w-auto brightness-0 invert" />

            <p className="mt-4 text-[13px] leading-relaxed text-white/50">
              Plateforme SaaS complète de communication multi-canal pour entreprises.
              Centre d'appels cloud, SMS Bulk, WhatsApp Business et Email Marketing.
            </p>

            {/* Contact */}
            <div className="mt-5 space-y-2.5 text-[12px] text-white/50">
              <div className="flex items-start gap-2">
                <MapPin size={13} className="mt-0.5 shrink-0 text-[#FE5B29]" />
                <span>
                  Actor Hub, 5 Rue Gemena, Quartier Haut commandement,
                  Gombe, Kinshasa / RDCONGO — BP: 12345 Kinshasa
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={13} className="shrink-0 text-[#FE5B29]" />
                <span>+243 970 979 888 / +243 822 724 146</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={13} className="shrink-0 text-[#FE5B29]" />
                <span>contact@biargroup.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={13} className="shrink-0 text-[#FE5B29]" />
                <span>biar.groupafrica@gmail.com</span>
              </div>
            </div>

            {/* Socials */}
            <div className="mt-5 flex gap-2.5">
              {[Facebook, Twitter, Linkedin, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/8 text-white/50 transition-colors hover:bg-[#FE5B29] hover:text-white"
                  aria-label="Social"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Solutions */}
          <div>
            <p className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-white/40">
              Solutions
            </p>
            <ul className="space-y-2.5">
              {solutions.map((s) => (
                <li key={s}>
                  <a href="#" className="text-[13px] text-white/60 transition-colors hover:text-[#FE5B29]">
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <p className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-white/40">
              Entreprise
            </p>
            <ul className="space-y-2.5">
              {company.map((c) => (
                <li key={c}>
                  <a href="#" className="text-[13px] text-white/60 transition-colors hover:text-[#FE5B29]">
                    {c}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-white/8 pt-6 text-[12px] text-white/30 sm:flex-row">
          <span>© 2026 Actor Hub. Tous droits réservés.</span>
          <span>Pour vous, on se dépasse.</span>
        </div>
      </div>
    </footer>
  )
}
