export default function DashboardFooter() {
  return (
    <footer className="mt-8 bg-[#2563EB] px-8 py-8 text-white">
      <div className="flex items-start justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-end gap-[2px]">
              {[3, 5, 7, 5, 3].map((h, i) => (
                <div key={i} className="w-[3px] rounded-full bg-white" style={{ height: `${h * 2}px` }} />
              ))}
            </div>
            <span className="text-sm font-bold">Actor Hub</span>
          </div>
          <div className="space-y-0.5 text-[11px] text-white/80">
            <p>📍 5 Rue Gemena, Quartier Haut commandement</p>
            <p className="pl-5">Gombe, Kinshasa / RDCONGO — BP: 12345 Kinshasa</p>
            <p>📞 +243 978 979 898 • +243 822 724 146</p>
            <p>✉ contact@biargroup.com</p>
            <p className="pl-4">biar.groupafrica@gmail.com</p>
          </div>
        </div>
        <div className="text-right text-[11px] text-white/70">
          <p className="font-medium text-white">© 2026 Actor Hub. All rights reserved.</p>
          <p>For you, we go above and beyond.</p>
        </div>
      </div>
    </footer>
  )
}
