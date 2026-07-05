import { useState, useEffect } from 'react'

const ICON_PATHS = {
  dashboard:   ['M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z','M3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z','M13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z','M13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z'],
  idcard:      ['M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z'],
  building:    ['M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21'],
  tablecells:  ['M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h1.5m-1.5 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m7.5-3.75c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m0 0h1.5'],
  fingerprint: 'M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33',
  swap:        'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
  cog:         ['M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z'],
  bell:        'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
  logout:      'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9',
  menu:        'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
  x:           'M6 18L18 6M6 6l12 12',
}

function SvgIcon({ name, size = 18, className = '' }) {
  const d = ICON_PATHS[name]
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  )
}

const NAV_ITEMS = [
  { label: 'Today',          icon: 'dashboard',   route: '/admin/today'          },
  { label: 'Employees',      icon: 'idcard',      route: '/admin/employees'      },
  { label: 'Branches',       icon: 'building',    route: '/admin/branches'       },
  { label: 'Schedule',       icon: 'tablecells',  route: '/admin/schedule'       },
  { label: 'Attendance',     icon: 'fingerprint', route: '/admin/attendance'     },
  { label: 'Shift Requests', icon: 'swap',        route: '/admin/shift-requests' },
  { label: 'Settings',       icon: 'cog',         route: '/admin/settings'       },
]

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }

export default function AppShell({ role = 'admin', activePage = 'Today', children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setSidebarOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('current_user')) } catch { return null } })()
  const user = storedUser
    ? {
        name:     storedUser.name,
        email:    storedUser.email || `${storedUser.name?.toLowerCase().replace(/\s+/g, '.')}@company.com`,
        role:     capitalize(storedUser.role),
        avatar:   storedUser.avatar || null,
        initials: storedUser.name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      }
    : { name: 'Admin User', email: 'admin@company.com', role: 'Admin', avatar: null, initials: 'AU' }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

  const handleNav    = (route) => { window.location.href = route; setSidebarOpen(false) }
  const handleLogout = async () => {
    try { const { signOut } = await import('../../utils/auth'); await signOut() } catch {}
    window.location.href = '/login'
  }

  return (
    <div className="flex h-screen bg-[#F7F8F6] font-sans overflow-hidden">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          group/sidebar
          relative flex flex-col flex-shrink-0 overflow-hidden
          transition-all duration-300 ease-in-out
          fixed inset-y-0 left-0 z-30 w-64
          ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
          lg:relative lg:translate-x-0 lg:w-[72px] lg:hover:w-64
        `}
        style={{ backgroundColor: '#3A5A40' }}
      >

        {/* Close button — mobile only, top-right corner */}
        <button onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-3 right-3 z-10 p-1.5 rounded-lg
                     text-white/30 hover:text-white hover:bg-white/10 transition-colors">
          <SvgIcon name="x" size={15} />
        </button>

        {/* ── User Profile — centered, stacked ── */}
        <div className="flex flex-col items-center px-3 pt-6 pb-4 flex-shrink-0">

          {/* Avatar — image-ready */}
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center ring-2 ring-white/20"
              style={{ backgroundColor: '#2A4128' }}>
              {user.avatar
                ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                : <span className="text-white text-xl font-bold select-none">{user.initials}</span>
              }
            </div>
            {/* Online dot */}
            <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#3A5A40]" />
          </div>

          {/* Name + email — centered below avatar, collapse-aware */}
          <div className="w-full text-center overflow-hidden
                          opacity-100 max-h-16
                          lg:opacity-0 lg:max-h-0
                          lg:group-hover/sidebar:opacity-100 lg:group-hover/sidebar:max-h-16
                          transition-[opacity,max-height] duration-300 ease-in-out">
            <p className="text-[13px] font-semibold text-white truncate px-2">{user.name}</p>
            <p className="text-[11px] text-white/45 truncate mt-0.5 px-2">{user.email}</p>
          </div>
        </div>

        {/* Thin separator */}
        <div className="mx-4 mb-2 h-px bg-white/8 flex-shrink-0" />

        {/* ── Nav items ── */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map(item => {
            const active = item.label === activePage
            return (
              <button key={item.label} onClick={() => handleNav(item.route)}
                title={item.label}
                className={`
                  w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium text-left
                  transition-all duration-150 group/item
                  ${active
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-white hover:bg-white/6'
                  }
                `}>

                {/* Icon */}
                <SvgIcon name={item.icon} size={18} className="flex-shrink-0" />

                {/* Label */}
                <span className="whitespace-nowrap overflow-hidden flex-1
                                  opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100
                                  transition-opacity duration-200">
                  {item.label}
                </span>

                {/* Badge */}
                {item.badge && (
                  <span className={`
                    text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none flex-shrink-0
                    opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-200
                    ${active ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'}
                  `}>
                    {item.badge}
                  </span>
                )}

                {/* Active indicator bar */}
                {active && (
                  <span className="w-1 h-4 rounded-full bg-[#5B8C5A] flex-shrink-0
                                    opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100
                                    transition-opacity duration-200" />
                )}
              </button>
            )
          })}
        </nav>

        {/* ── Bottom: logout ── */}
        <div className="flex-shrink-0 overflow-hidden">
          <div className="mx-4 h-px bg-white/8" />
          <div className="flex items-center justify-center px-3.5 py-3">
            <button onClick={() => setLogoutOpen(true)} title="Logout"
              className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl
                         text-white/40 hover:text-red-400 hover:bg-white/5
                         transition-colors text-sm font-medium">
              <SvgIcon name="logout" size={18} className="flex-shrink-0" />
              <span className="whitespace-nowrap
                               opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100
                               transition-opacity duration-200">
                Logout
              </span>
            </button>
          </div>
        </div>

      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 flex-shrink-0 z-10">

          {/* Hamburger — mobile */}
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors -ml-1">
            <SvgIcon name="menu" size={20} />
          </button>

          {/* Page title — mobile */}
          <p className="text-sm font-semibold text-slate-700 lg:hidden flex-1">{activePage}</p>

          {/* Logo + brand — desktop, left side of topbar */}
          <div className="hidden lg:flex items-center gap-2.5 flex-1">
            <img src="/logo.png" alt="AttendPro" className="w-10 h-10 object-contain flex-shrink-0" />
            <div className="leading-tight">
              <p className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">
                Attend<span className="text-[#5B8C5A]">Pro</span>
              </p>
            </div>
          </div>

          {/* Date */}
          <span className="text-xs text-slate-400 hidden md:block">{today}</span>

          {/* Avatar — top bar on mobile */}
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 lg:hidden"
            style={{ backgroundColor: '#2A4128' }}>
            {user.avatar
              ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              : <span className="text-white text-[11px] font-bold">{user.initials}</span>
            }
          </div>

        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

      </div>

      {/* Logout confirmation */}
      {logoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setLogoutOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
              <SvgIcon name="logout" size={20} className="text-red-500" />
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
