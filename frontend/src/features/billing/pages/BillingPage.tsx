import PageTransition from '../../../components/animations/PageTransition'

export default function BillingPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-white">Facturation & Plans</h1>
        {/* TODO: plans SaaS, abonnements, factures, Mobile Money RDC (M-Pesa, Airtel, Orange) */}
      </div>
    </PageTransition>
  )
}
