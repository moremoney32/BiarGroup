import PageTransition from '../../../components/animations/PageTransition'

export default function SmsPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-white">B-SMSBULK — SMS Marketing</h1>
        {/* TODO: campagnes, contacts, templates, SMPP config, OTP */}
      </div>
    </PageTransition>
  )
}
