import { Search, Sun, Bell, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAppSelector } from '../../store/index'
import { selectUnreadCount } from '../../store/slices/notificationSlice'

export default function Navbar() {
  const { logout } = useAuth()
  const unread = useAppSelector(selectUnreadCount)

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher..."
          className="w-full rounded-full bg-[#EDE5F9] py-1.5 pl-8 pr-4 text-[12px] text-gray-700 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#F4511E]/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Thème">
          <Sun size={15} />
        </button>

        <button className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium text-gray-500 hover:bg-gray-100">
          🇫🇷 <span>FR</span>
        </button>

        <button className="relative rounded-lg p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Notifications">
          <Bell size={15} />
          {unread > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#F4511E] text-[8px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        <button
          onClick={logout}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          aria-label="Déconnexion"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  )
}
