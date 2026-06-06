import { Outlet } from "react-router-dom"
import Sidebar from "../components/Sidebar"

const Layout = () => {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-8 md:p-10 lg:p-12 max-w-7xl mx-auto">
                <Outlet/>
            </div>
        </main>
    </div>
  )
}

export default Layout