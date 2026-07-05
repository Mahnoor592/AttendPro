import { useState, useEffect, useRef } from 'react'
import AppShell from '../../components/layout/AppShell'
import { getBranches, createBranch, updateBranch, updateBranchImage, deleteBranch } from '../../api/branches'
import { getEmployees } from '../../api/employees'
import TimePicker from '../../components/ui/TimePicker'

const BLANK = { name: '', address: '', lat: '', lng: '', radius: 200, shift_start: '09:00', shift_end: '17:00' }

/* ─────────────── helpers ─────────────── */
function shiftTime12(t) {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}
function hhmm(t) { return t ? t.slice(0, 5) : '' }
function branchCode(id) { return `BR-${String(id).padStart(3, '0')}` }

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_ABBR = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' }
function formatWorkingDays(wd) {
  if (!wd) return '—'
  return wd.split(',').map(d => DAY_ABBR[d] || d).join(', ')
}
function formatCreatedAt(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return isNaN(d) ? '—' : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Icon({ d, size = 16, className = '', stroke = 'currentColor', sw = 1.75 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  )
}
const IC = {
  plus:    'M12 5v14M5 12h14',
  edit:    'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125',
  trash:   ['M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'],
  x:       'M6 18L18 6M6 6l12 12',
  pin:     ['M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z', 'M12 10a2 2 0 100-4 2 2 0 000 4z'],
  clock:   ['M12 12l3 2', 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  users:   'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
  check:   'M9 12.75l2.25 2.25L15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  chevL:   'M15.75 19.5L8.25 12l7.5-7.5',
  chevR:   'M8.25 4.5l7.5 7.5-7.5 7.5',
  dots:    ['M12 6.75a.75.75 0 100-1.5.75.75 0 000 1.5z', 'M12 12.75a.75.75 0 100-1.5.75.75 0 000 1.5z', 'M12 18.75a.75.75 0 100-1.5.75.75 0 000 1.5z'],
  camera:  ['M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z', 'M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z'],
  code:    'M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5',
  globe:   ['M12 21a9 9 0 100-18 9 9 0 000 18z', 'M3.6 9h16.8M3.6 15h16.8', 'M11.99 3a17 17 0 000 18M12.01 3a17 17 0 010 18'],
  mail:    ['M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75', 'M21.75 6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75'],
  phone:   'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
  calendar:'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
}

/* ─────────────── office photo (upload preview; no backend persist yet) ─────────────── */
function OfficePhoto({ branch, photo, onUpload, radius }) {
  const fileRef = useRef(null)
  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onUpload(branch.id, ev.target.result)
    reader.readAsDataURL(file)
  }
  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 h-full min-h-[300px] group">
      {photo ? (
        <img src={photo} alt={branch.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-100 to-slate-200/70">
          <div className="w-16 h-16 rounded-2xl bg-white/70 flex items-center justify-center">
            <Icon d={IC.camera} size={28} className="text-slate-400" sw={1.5} />
          </div>
          <p className="text-sm font-semibold text-slate-500">No office photo yet</p>
        </div>
      )}
      <button onClick={() => fileRef.current?.click()}
        className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-white/60 shadow-sm text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white transition-colors">
        <Icon d={IC.camera} size={13} /> {photo ? 'Change photo' : 'Upload photo'}
      </button>
      {radius != null && (
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
          <Icon d={IC.pin} size={14} stroke="#5B8C5A" sw={1.9} />
          <p className="text-xs font-semibold text-slate-700">Geofence Radius: <span className="text-teal-700 font-bold">{radius} meters</span></p>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

/* ─────────────── gallery card ─────────────── */
function BranchCard({ branch, photo, staff, onOpen }) {
  return (
    <button onClick={() => onOpen(branch.id)}
      className="text-left bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
      <div className="relative h-36 bg-slate-100">
        {photo
          ? <img src={photo} alt={branch.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200/70">
              <Icon d={IC.camera} size={26} className="text-slate-300" sw={1.5} />
            </div>}
        <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
        </span>
      </div>
      <div className="p-4">
        <p className="text-sm font-bold text-slate-800 truncate">{branch.name}</p>
        <p className="text-xs text-slate-400 truncate mt-0.5">{branch.address}</p>
        <div className="flex items-center gap-3 mt-3 text-[11px]">
          <span className="inline-flex items-center gap-1 text-slate-500"><Icon d={IC.users} size={12} /> {staff} staff</span>
          <span className="inline-flex items-center gap-1 text-teal-700 font-semibold"><Icon d={IC.pin} size={12} stroke="#5B8C5A" /> {branch.radius}m</span>
          <span className="inline-flex items-center gap-1 text-slate-500"><Icon d={IC.clock} size={12} /> {hhmm(branch.shift_start)}</span>
        </div>
      </div>
    </button>
  )
}

/* ─────────────── stat cards ─────────────── */
function StatCard({ label, icon, iconColor, iconBg, value, sub }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex flex-col">
      <p className="text-[11px] font-semibold text-slate-400 mb-2">{label}</p>
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon d={icon} size={16} className={iconColor} sw={1.9} />
        </div>
        <span className="text-2xl font-bold text-slate-800 tabular-nums">{value}</span>
      </div>
      {sub && <p className="text-[11px] text-slate-400 mt-2">{sub}</p>}
    </div>
  )
}

function GeofenceCard({ radius }) {
  return (
    <div className="col-span-2 bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between overflow-hidden">
      <div>
        <p className="text-[11px] font-semibold text-slate-400 mb-2">Geofence Radius</p>
        <div className="flex items-end gap-1.5">
          <span className="text-3xl font-bold text-slate-800 tabular-nums">{radius}</span>
          <span className="text-sm font-semibold text-slate-400 mb-1">meters</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">Employees can check in within this range</p>
      </div>
      {/* concentric-circle graphic */}
      <div className="relative w-24 h-24 flex-shrink-0 hidden sm:grid place-items-center">
        <span className="absolute w-24 h-24 rounded-full bg-teal-500/5" />
        <span className="absolute w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/20" />
        <span className="absolute w-8 h-8 rounded-full bg-teal-500/15 border border-teal-500/30" />
        <Icon d={IC.pin} size={20} stroke="#5B8C5A" sw={2} className="relative" />
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon d={icon} size={14} className="text-slate-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-700 mt-0.5 break-words">{value}</p>
      </div>
    </div>
  )
}

/* ─────────────── profile view ─────────────── */
function BranchProfile({ branch, staff, photo, onUpload, onBack, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="space-y-5 pb-10">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
        <Icon d={IC.chevL} size={15} /> Branches
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{branch.name}</h1>
            <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">{branch.address}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit}
            className="flex items-center gap-1.5 bg-[#3A5A40] hover:bg-[#2f4a34] text-white text-sm font-semibold px-3.5 py-2 rounded-lg transition-colors">
            <Icon d={IC.edit} size={14} /> Edit Branch
          </button>
          <div className="relative">
            <button onClick={() => setMenuOpen(v => !v)}
              className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors">
              <Icon d={IC.dots} size={17} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  <button onClick={() => { setMenuOpen(false); onDelete() }}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
                    <Icon d={IC.trash} size={14} /> Delete branch
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Body: photo + (stats + info) */}
      <div className="grid lg:grid-cols-[minmax(300px,360px)_1fr] gap-5 items-stretch">
        <OfficePhoto branch={branch} photo={photo} onUpload={onUpload} radius={branch.radius} />

        <div className="space-y-5">
          {/* stat cards: employees, status, geofence(x2) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Employees" icon={IC.users} iconColor="text-slate-600" iconBg="bg-slate-100" value={staff} sub="Total assigned" />
            <StatCard label="Status" icon={IC.check} iconColor="text-green-600" iconBg="bg-green-50" value="Active" sub="Operational" />
            <GeofenceCard radius={branch.radius} />
          </div>

          {/* branch information */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-base font-bold text-slate-800 mb-5">Branch Information</h3>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
              <InfoRow icon={IC.code}     label="Branch Code"  value={branchCode(branch.id)} />
              <InfoRow icon={IC.mail}     label="Email"        value={branch.email || '—'} />
              <InfoRow icon={IC.phone}    label="Phone"        value={branch.phone || '—'} />
              <InfoRow icon={IC.users}    label="Manager"      value={branch.manager || '—'} />
              <InfoRow icon={IC.clock}    label="Timings"      value={branch.shift_start ? `${shiftTime12(branch.shift_start)} – ${shiftTime12(branch.shift_end)}` : '—'} />
              <InfoRow icon={IC.calendar} label="Working Days" value={formatWorkingDays(branch.working_days)} />
              <InfoRow icon={IC.pin}      label="Location"     value={branch.address} />
              <InfoRow icon={IC.calendar} label="Created On"   value={formatCreatedAt(branch.created_at)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* parse "34.0089, 71.4779" → { lat, lng } (null if invalid) */
function parseCoords(s) {
  if (!s) return null
  const parts = s.split(',').map(p => parseFloat(p.trim()))
  if (parts.length !== 2 || parts.some(Number.isNaN)) return null
  const [lat, lng] = parts
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { lat, lng }
}

const ADDRESS_HINT = 'Geofence check-in is based on the coordinates below, not this address — the address is just a label.'
const COORD_HINT = 'On Google Maps, right-click the location → click the coordinates to copy, then paste here.'

/* ─────────────── add modal ─────────────── */
function AddModal({ onSave, onClose }) {
  const [name, setName]       = useState('')
  const [address, setAddress] = useState('')
  const [coords, setCoords]   = useState('')
  const [err, setErr]         = useState('')
  const [saving, setSaving]   = useState(false)

  const submit = async () => {
    if (!name.trim())    { setErr('Branch name is required.'); return }
    if (!address.trim()) { setErr('Address is required.'); return }
    const c = parseCoords(coords)
    if (!c)              { setErr('Enter valid coordinates, e.g. 34.0089, 71.4779'); return }
    setSaving(true); setErr('')
    const r = await onSave({ ...BLANK, name: name.trim(), address: address.trim(), lat: c.lat, lng: c.lng })
    setSaving(false)
    if (r?.error) setErr(r.error)
  }

  const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800">Add New Branch</h2>
            <p className="text-xs text-slate-400 mt-0.5">Set geofence radius & shift hours after adding</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"><Icon d={IC.x} size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Branch Name</label>
            <input value={name} onChange={e => { setName(e.target.value); setErr('') }} placeholder="e.g. Peshawar Office" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Address</label>
            <input value={address} onChange={e => { setAddress(e.target.value); setErr('') }} placeholder="Full address (shown as a label)" className={inputCls} />
            <p className="text-[11px] text-slate-400 mt-1.5">📍 {ADDRESS_HINT}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Coordinates (Latitude, Longitude)</label>
            <input value={coords} onChange={e => { setCoords(e.target.value); setErr('') }} placeholder="34.0089, 71.4779" className={inputCls} />
            <p className="text-[11px] text-slate-400 mt-1.5">📍 {COORD_HINT}</p>
          </div>
          {err && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-[#3A5A40] hover:bg-[#2f4a34] disabled:bg-teal-300 text-sm font-semibold text-white transition-colors">{saving ? 'Adding…' : 'Add Branch'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────── edit modal ─────────────── */
function EditModal({ branch, employees, onSave, onClose }) {
  const [form, setForm] = useState({
    name: branch.name, address: branch.address, email: branch.email || '', phone: branch.phone || '',
    coords: `${branch.lat}, ${branch.lng}`, radius: branch.radius,
    shift_start: hhmm(branch.shift_start), shift_end: hhmm(branch.shift_end),
    working_days: branch.working_days ? branch.working_days.split(',') : [],
    manager_id: branch.manager_id || '',
    created_at: branch.created_at ? new Date(branch.created_at).toISOString().slice(0, 10) : '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleDay = (day) => setForm(f => ({
    ...f,
    working_days: f.working_days.includes(day) ? f.working_days.filter(d => d !== day) : [...f.working_days, day],
  }))

  const submit = async () => {
    const c = parseCoords(form.coords)
    if (!c) { setErr('Enter valid coordinates, e.g. 34.0089, 71.4779'); return }
    setSaving(true); setErr('')
    const payload = { ...form, lat: c.lat, lng: c.lng, radius: Number(form.radius), working_days: form.working_days.join(',') }
    delete payload.coords
    const r = await onSave(branch.id, payload)
    setSaving(false)
    if (r?.error) setErr(r.error)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-base font-bold text-slate-800">Edit Branch</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"><Icon d={IC.x} size={16} /></button>
        </div>
        <div className="px-6 py-5 overflow-y-auto grid grid-cols-2 gap-x-4 gap-y-4">
          {err && <p className="col-span-2 text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}

          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Branch Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition" />
          </div>

          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Address</label>
            <input value={form.address} onChange={e => set('address', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition" />
            <p className="text-[11px] text-slate-400 mt-1.5">📍 {ADDRESS_HINT}</p>
          </div>

          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Coordinates (Latitude, Longitude)</label>
            <input value={form.coords} onChange={e => set('coords', e.target.value)} placeholder="34.0089, 71.4779"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition" />
            <p className="text-[11px] text-slate-400 mt-1.5">📍 {COORD_HINT}</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="branch@company.com"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Phone</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+92 42 1234567"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition" />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Manager</label>
            <select value={form.manager_id} onChange={e => set('manager_id', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition">
              <option value="">— No manager —</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Created On</label>
            <input type="date" value={form.created_at} onChange={e => set('created_at', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition" />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Opening Time</label>
            <TimePicker value={form.shift_start} onChange={v => set('shift_start', v)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Closing Time</label>
            <TimePicker value={form.shift_end} onChange={v => set('shift_end', v)} />
          </div>

          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Geofence Radius — <span className="text-teal-700 font-bold">{form.radius}m</span></label>
            <input type="range" min="50" max="1000" step="10" value={form.radius} onChange={e => set('radius', Number(e.target.value))} className="w-full accent-teal-600" />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1"><span>50m</span><span>1000m</span></div>
          </div>

          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-500 block mb-2">Working Days</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_DAYS.map(day => {
                const on = form.working_days.includes(day)
                return (
                  <button key={day} type="button" onClick={() => toggleDay(day)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${on ? 'bg-[#3A5A40] text-white border-[#3A5A40]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                    {DAY_ABBR[day]}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-[#3A5A40] hover:bg-[#2f4a34] disabled:bg-teal-300 text-sm font-semibold text-white transition-colors">{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  )
}

function ConfirmDelete({ name, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3"><Icon d={IC.trash} size={20} className="text-red-500" /></div>
        <h3 className="text-base font-bold text-slate-800">Delete Branch?</h3>
        <p className="text-sm text-slate-500 mt-2"><span className="font-semibold text-slate-700">{name}</span> will be permanently deleted.</p>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-sm font-semibold text-white transition-colors">Delete</button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────── page ─────────────── */
export default function BranchesPage() {
  const [branches, setBranches]     = useState([])
  const [employees, setEmployees]   = useState([])   // for the manager dropdown
  const [staffCount, setStaffCount] = useState({})   // branch_id -> count
  const [selectedId, setSelectedId] = useState(null)
  const [addOpen, setAddOpen]       = useState(false)
  const [editOpen, setEditOpen]     = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  const selected = branches.find(b => b.id === selectedId) || null

  const load = () => {
    setLoading(true)
    Promise.all([getBranches(), getEmployees()])
      .then(([bRes, eRes]) => {
        setBranches(bRes.data.data || bRes.data)
        const emps = eRes.data.data || eRes.data
        setEmployees(emps)
        const counts = {}
        emps.forEach(e => { if (e.branch_id) counts[e.branch_id] = (counts[e.branch_id] || 0) + 1 })
        setStaffCount(counts)
      })
      .catch(() => setError('Failed to load branches'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleAdd = async (form) => {
    try {
      const res = await createBranch(form)
      const b = res.data.data || res.data
      setBranches(p => [...p, b])
      setAddOpen(false)
      setSelectedId(b.id)
    } catch (err) { return { error: err.response?.data?.message || 'Failed to add branch.' } }
  }

  const handleUpdate = async (id, form) => {
    try {
      const res = await updateBranch(id, form)
      const updated = res.data.data || res.data
      setBranches(p => p.map(b => b.id === updated.id ? updated : b))
      setEditOpen(false)
    } catch (err) { return { error: err.response?.data?.message || 'Failed to update branch.' } }
  }

  const handleDelete = async () => {
    try {
      await deleteBranch(selectedId)
      setBranches(p => p.filter(b => b.id !== selectedId))
      setDeleteOpen(false)
      setSelectedId(null)
    } catch { setError('Failed to delete branch') }
  }

  const onUploadPhoto = async (id, dataUrl) => {
    try {
      const res = await updateBranchImage(id, dataUrl)
      const updated = res.data.data || res.data
      setBranches(p => p.map(b => b.id === updated.id ? updated : b))
    } catch { setError('Failed to save photo') }
  }

  return (
    <AppShell role="admin" activePage="Branches">
      {loading ? (
        <div className="flex items-center justify-center h-full text-slate-400">Loading branches…</div>
      ) : error ? (
        <div className="flex items-center justify-center h-full text-red-400">{error}</div>
      ) : selected ? (
        <BranchProfile
          branch={selected}
          staff={staffCount[selected.id] || 0}
          photo={selected.image}
          onUpload={onUploadPhoto}
          onBack={() => setSelectedId(null)}
          onEdit={() => setEditOpen(true)}
          onDelete={() => setDeleteOpen(true)}
        />
      ) : (
        <div className="space-y-6 pb-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Branches</h1>
                <p className="text-sm text-slate-400 mt-0.5">{branches.length} location{branches.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <button onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 bg-[#3A5A40] hover:bg-[#2f4a34] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
              <Icon d={IC.plus} size={15} /> Add Branch
            </button>
          </div>

          {branches.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Icon d={IC.pin} size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No branches yet</p>
              <p className="text-xs text-slate-400 mt-1">Add your first office location to get started.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.map(b => (
                <BranchCard key={b.id} branch={b} photo={b.image} staff={staffCount[b.id] || 0} onOpen={setSelectedId} />
              ))}
            </div>
          )}
        </div>
      )}

      {addOpen && <AddModal onSave={handleAdd} onClose={() => setAddOpen(false)} />}
      {editOpen && selected && <EditModal branch={selected} employees={employees} onSave={handleUpdate} onClose={() => setEditOpen(false)} />}
      {deleteOpen && selected && <ConfirmDelete name={selected.name} onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)} />}
    </AppShell>
  )
}
