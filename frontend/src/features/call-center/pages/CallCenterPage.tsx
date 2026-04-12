import PageTransition from '../../../components/animations/PageTransition'

export default function CallCenterPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-white">B-GOTOCALL — Call Center</h1>
        {/* TODO: Softphone, agents, files d'attente, SVI, ACD, power dialer */}
      </div>
    </PageTransition>
  )
}
