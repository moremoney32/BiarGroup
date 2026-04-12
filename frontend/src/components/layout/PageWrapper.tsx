import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function PageWrapper() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F5]">
      <Sidebar />
      <div className="ml-[168px] flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
