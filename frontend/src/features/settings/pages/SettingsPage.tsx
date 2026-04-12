import PageTransition from '../../../components/animations/PageTransition'

export default function SettingsPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-white">Paramètres</h1>
        {/* TODO: profil, SMTP, SMPP, API keys, notifications, langue, sécurité */}
      </div>
    </PageTransition>
  )
}
