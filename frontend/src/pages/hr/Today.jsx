import AppShell from '../../components/layout/AppShell'

const STATS = [
  { label: 'Total Employees', value: 42, sub: 'across 2 branches',          dot: 'bg-teal-500' },
  { label: 'Present Now',     value: 28, sub: '66% attendance rate',         dot: 'bg-green-500'  },
  { label: 'Late Today',      value: 5,  sub: 'checked in after shift start', dot: 'bg-amber-400'  },
  { label: 'Absent',          value: 9,  sub: 'no check-in recorded',         dot: 'bg-red-400'    },
]

const PENDING_REQUESTS = [
  { name: 'Usman Ali',   from: 'Mon 9â€“5', to: 'Mon 12â€“8', reason: 'Doctor appointment in the morning', submitted: '2h ago' },
  { name: 'Nida Rehman', from: 'Thu 9â€“5', to: 'Thu 2â€“10', reason: 'Family event on Thursday evening',  submitted: '5h ago' },
  { name: 'Haris Shah',  from: 'Fri 9â€“5', to: 'Fri 1â€“9',  reason: 'Driving test scheduled at 10 AM',  submitted: '1d ago' },
]

const AVATAR_COLORS = ['bg-teal-500', 'bg-violet-400', 'bg-slate-500', 'bg-cyan-600', 'bg-slate-400']

function initials(name) { return name.split(' ').map(n => n[0]).join('') }
function avatarColor(name) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] }

function StatCard({ label, value, sub, dot }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      </div>
      <p className="text-4xl font-bold tabular-nums text-slate-800">{value}</p>
      <p className="text-xs mt-2 text-slate-400">{sub}</p>
    </div>
  )
}

function RequestRow({ item }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className={`w-8 h-8 rounded-full ${avatarColor(item.name)} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <span className="text-white text-[11px] font-bold">{initials(item.name)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{item.name}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          <span className="line-through text-slate-300">{item.from}</span>
          <span className="mx-1.5 text-slate-300">â†’</span>
          <span className="text-teal-600 font-medium">{item.to}</span>
        </p>
        <p className="text-xs text-slate-400 mt-0.5 truncate">"{item.reason}"</p>
      </div>
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors">
          Approve
        </button>
        <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-semibold rounded-lg transition-colors">
          Deny
        </button>
      </div>
    </div>
  )
}

export default function HRToday() {
  return (
    <AppShell role="hr" activePage="Today">
      <div className="space-y-6 pb-16">

        <div>
          <h2 className="text-xl font-bold text-slate-800">Good morning, Sarah</h2>
          <p className="text-sm text-slate-400 mt-0.5">3 shift requests are awaiting your review.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          {STATS.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Pending Shift Requests */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Pending Requests</h3>
              <p className="text-xs text-slate-400 mt-0.5">Awaiting your decision</p>
            </div>
            <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-semibold">3 pending</span>
          </div>
          <div>
            {PENDING_REQUESTS.map((r, i) => <RequestRow key={i} item={r} />)}
          </div>
        </div>

      </div>
    </AppShell>
  )
}
