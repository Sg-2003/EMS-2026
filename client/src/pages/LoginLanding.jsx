import LoginLeftSide from "../components/LoginLeftSide"
import { ArrowRightIcon } from "lucide-react"
import { Link } from "react-router-dom"

const LoginLanding = () => {
    const portalOptions = [{
        to: '/login/admin',
        title: 'Admin Portal',
    },
    {
        to: '/login/employee',
        title: 'Employee Portal',
    }]
    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
            <LoginLeftSide />
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16 relative overflow-y-auto max-h-screen">
                <div className="w-full max-w-md animate-fade-in relative z-10">
                    {/* logo */}
                    <div className="flex items-center gap-3 mb-10 justify-center md:justify-start">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
                            <svg viewBox="0 0 64 64" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="32" cy="14" r="8" fill="white"/>
                                <line x1="32" y1="22" x2="32" y2="32" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
                                <line x1="32" y1="32" x2="16" y2="32" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
                                <line x1="32" y1="32" x2="48" y2="32" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
                                <line x1="16" y1="32" x2="16" y2="40" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
                                <line x1="48" y1="32" x2="48" y2="40" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
                                <circle cx="16" cy="48" r="8" fill="white"/>
                                <circle cx="48" cy="48" r="8" fill="white"/>
                            </svg>
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">Quick</span>
                            <span className="text-2xl font-bold text-indigo-600 tracking-tight">EMS</span>
                        </div>
                    </div>
                    {/* header  */}
                    <div className="mb-10 text-center md:text-left">
                        <h2 className="text-3xl font-semibold text-slate-900 tracking-tight mb-2">Welcome Back</h2>
                        <p className="text-slate-500">Select your portal to securely access the system.</p>
                    </div>
                    {/* portals list  */}
                    <div className="space-y-4">
                        {portalOptions.map((portal) => (
                            <Link key={portal.to} to={portal.to} className="group block bg-slate-100 border border-slate-200 rounded-lg p-5 sm:p-6 transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-50">
                                <div className="relative z-10 flex items-center justify-between gap-4 sm:gap-5">
                                    <h3 className="text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">{portal.title}</h3>
                                    <ArrowRightIcon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all duration-300" />
                                </div>
                            </Link>
                        ))}
                    </div>
                    {/* footer  */}
                    <div className="mt-12 text-center md:text-left text-sm text-slate-400">
                        <p>© 2026 QuickEMS. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoginLanding