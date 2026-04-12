import PageTransition from '../../../components/animations/PageTransition'

export default function ReportingPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-white">Rapports & Analytics</h1>
        {/* TODO: charts Recharts, filtres date, export CSV/PDF, audit logs */}
      </div>
    </PageTransition>
  )
}
