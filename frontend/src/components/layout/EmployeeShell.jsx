import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../../utils/auth'

function getUser() {
  try { return JSON.parse(localStorage.getItem('current_user')) } catch { return null }
}
function initials(name) { return name?.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U' }

function Icon({ d, size = 20, className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  )
}
const IC = {
  clock:    'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  calendar: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
  logout:   'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9',
}

const NAV = [
  { key: 'Clock In', label: 'Clock In', path: '/employee/today', icon: IC.clock },
  { key: 'My Work',  label: 'My Work',  path: '/employee/work',  icon: IC.calendar },
]

export default function EmployeeShell({ activePage = 'Clock In', children }) {
  const navigate = useNavigate()
  const user = getUser()
  const [logoutOpen, setLogoutOpen] = useState(false)

  const go = (path) => navigate(path)
  const handleLogout = () => { signOut(); navigate('/login') }

  return (
    <div className="min-h-screen bg-[#F7F8F6] flex font-sans">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-60 flex-shrink-0 flex-col text-white" style={{ backgroundColor: '#3A5A40' }}>
        {/* brand */}
        <div className="flex items-center gap-2.5 px-5 pt-6 pb-5">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="AttendPro" className="w-7 h-7 object-contain" />
          </div>
          <span className="text-lg font-extrabold tracking-tight">AttendPro</span>
        </div>

        {/* nav */}
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map(item => {
            const active = item.key === activePage
            return (
              <button key={item.key} onClick={() => go(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-colors
                  ${active ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white hover:bg-white/8'}`}>
                <Icon d={item.icon} size={18} className="flex-shrink-0" />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* logout */}
        <div className="p-3 border-t border-white/10">
          <button onClick={() => setLogoutOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:text-red-300 hover:bg-white/8 transition-colors">
            <Icon d={IC.logout} size={18} className="flex-shrink-0" /> Log out
          </button>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* mobile top bar */}
        <header className="md:hidden bg-white border-b border-slate-200 h-14 flex items-center justify-between px-4 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="AttendPro" className="w-8 h-8 object-contain" />
            <span className="text-base font-extrabold text-slate-800">Attend<span className="text-[#3A5A40]">Pro</span></span>
          </div>
          <button onClick={() => setLogoutOpen(true)} className="text-slate-400 hover:text-red-400" title="Log out">
            <Icon d={IC.logout} size={18} />
          </button>
        </header>

        {/* desktop top bar */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center px-6 flex-shrink-0 sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{activePage}</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
          {children}
        </main>

        {/* mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex z-20">
          {NAV.map(item => {
            const active = item.key === activePage
            return (
              <button key={item.key} onClick={() => go(item.path)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors ${active ? 'text-[#3A5A40]' : 'text-slate-400'}`}>
                <Icon d={item.icon} size={20} />
                {item.label}
              </button>
            )
          })}
        </nav>

      </div>

      {/* Logout confirmation */}
      {logoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setLogoutOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
              <Icon d={IC.logout} size={20} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Log out?</h3>
            <p className="text-sm text-slate-500 mt-2">You'll need to sign in again to access your account.</p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setLogoutOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleLogout}
                className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-sm font-semibold text-white transition-colors">Log Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
