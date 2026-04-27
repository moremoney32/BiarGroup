import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { EmailBlock } from '../pages/EditeurEmailPage'

const VARS: Record<string, string> = {
  '{{prenom}}': 'Jean',
  '{{nom}}': 'Dupont',
  '{{email}}': 'jean.dupont@example.com',
  '{{entreprise}}': 'ACME SARL',
}

const applyVars = (text: string) =>
  Object.entries(VARS).reduce((t, [k, v]) => t.replaceAll(k, v), text)

const SOCIAL = [
  { label: 'f', color: '#1877f2' },
  { label: 'in', color: '#0077b5' },
  { label: 'tw', color: '#1da1f2' },
  { label: 'ig', color: '#e1306c' },
]

interface Props {
  open: boolean
  onClose: () => void
  sujet: string
  expediteur: string
  blocks: EmailBlock[]
  isMobile?: boolean
}

export default function PreviewEmailModal({ open, onClose, sujet, expediteur, blocks, isMobile }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-gray-100 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
                <div>
                  <p className="text-[13px] font-semibold text-gray-700">
                    Aperçu — {isMobile ? 'Mobile (375px)' : 'Desktop'}
                  </p>
                  <p className="text-[11px] text-gray-400">Variables remplacées par des exemples</p>
                </div>
                <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100" aria-label="Fermer">
                  <X size={15} />
                </button>
              </div>

              {/* Email preview */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className={`mx-auto overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ${isMobile ? 'max-w-[375px]' : 'max-w-lg'}`}>
                  {/* Email header */}
                  <div className="bg-[#F4511E] px-6 py-5 text-center">
                    <p className="text-[18px] font-bold text-white">{expediteur || 'BIAR GROUP AFRICA'}</p>
                    {sujet && <p className="mt-1 text-[12px] text-white/80">{sujet}</p>}
                  </div>

                  {/* Blocks */}
                  <div className="space-y-3 px-6 py-5">
                    {blocks.length === 0 && (
                      <p className="py-6 text-center text-[12px] italic text-gray-300">Aucun bloc dans cet email</p>
                    )}

                    {blocks.map(block => (
                      <div key={block.id}>
                        {block.type === 'texte' && (
                          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-gray-700">
                            {applyVars(block.content)}
                          </p>
                        )}

                        {block.type === 'image' && (
                          block.imageUrl
                            ? <img src={block.imageUrl} alt={block.imageAlt || ''} className="w-full rounded-lg" />
                            : <div className="flex h-28 items-center justify-center rounded-lg bg-gray-100 text-[12px] text-gray-300">Image non définie</div>
                        )}

                        {block.type === 'bouton' && (
                          <div className="text-center">
                            <a
                              href={block.buttonUrl || '#'}
                              target="_blank"
                              rel="noreferrer"
                              style={{ backgroundColor: block.buttonColor || '#F4511E' }}
                              className="inline-block rounded-lg px-6 py-2.5 text-[13px] font-semibold text-white"
                            >
                              {block.buttonLabel || 'Cliquez ici'}
                            </a>
                          </div>
                        )}

                        {block.type === 'separateur' && <hr className="border-gray-200" />}

                        {block.type === 'reseaux' && (
                          <div className="flex justify-center gap-3">
                            {SOCIAL.map(s => (
                              <div key={s.label} style={{ backgroundColor: s.color }}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white">
                                {s.label}
                              </div>
                            ))}
                          </div>
                        )}

                        {block.type === 'html' && (
                          <div className="rounded-lg bg-gray-50 p-3 font-mono text-[11px] text-gray-500">
                            {block.content || '(vide)'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-100 px-6 py-4 text-center">
                    <p className="text-[11px] font-medium text-gray-600">{expediteur || 'BIAR GROUP AFRICA'}</p>
                    <p className="text-[10px] text-gray-400">SARLU — Kinshasa, RDC</p>
                    <div className="mt-2 flex justify-center gap-3">
                      <span className="cursor-pointer text-[11px] text-[#F4511E] hover:underline">Se désabonner</span>
                      <span className="text-gray-300">|</span>
                      <span className="cursor-pointer text-[11px] text-[#F4511E] hover:underline">Gérer mes préférences</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
