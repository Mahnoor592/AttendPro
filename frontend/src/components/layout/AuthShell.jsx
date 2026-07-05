function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

const FEATURES = [
  'GPS geofence check-in',
  'Real-time attendance dashboard',
  'Shift scheduling & requests',
]

export default function AuthShell({ children }) {
  return (
    <div className="min-h-screen flex font-sans">

      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-[420px] flex-shrink-0 flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(150deg, #2f4a34 0%, #3A5A40 55%, #243a29 100%)' }}>

        {/* logo + wordmark */}
        <div className="relative z-10 flex items-center justify-center gap-3.5">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center overflow-hidden shadow-lg">
            <img src="/logo.png" alt="AttendPro" className="w-14 h-14 object-contain" />
          </div>
          <span className="text-3xl font-extrabold tracking-tight">AttendPro</span>
        </div>

        {/* headline + features */}
        <div className="relative z-10 max-w-sm">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight" style={{ textWrap: 'balance' }}>
            Smart attendance, pinned to your place.
          </h1>
          <p className="text-white/70 mt-3 text-sm leading-relaxed">
            GPS-verified check-ins, live dashboards, and effortless shift scheduling — all in one place.
          </p>
          <ul className="mt-8 space-y-3.5">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-3 text-sm text-white/90">
                <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0"><CheckIcon /></span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/40">© 2026 AttendPro · Smart Attendance Management</p>

        {/* decorative geofence rings */}
        <div className="absolute -bottom-28 -right-28 w-80 h-80 rounded-full border border-white/10" />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full border border-white/10" />
        <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full border border-white/10" />
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#F7F8F6]">
        <div className="w-full max-w-sm">
          {/* mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <img src="/logo.png" alt="AttendPro" className="w-10 h-10 object-contain" />
            <span className="text-xl font-extrabold text-slate-800">Attend<span className="text-[#3A5A40]">Pro</span></span>
          </div>
          {children}
        </div>
      </div>

    </div>
  )
}
