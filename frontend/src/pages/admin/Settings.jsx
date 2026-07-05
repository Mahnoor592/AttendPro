import { useState, useRef } from 'react'
import AppShell from '../../components/layout/AppShell'
import { updateProfile, updatePassword, deleteAccount } from '../../api/profile'

function Icon({ d, size = 16, className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
  )
}
const IC = {
  eye:    'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z',
  eyeOff: ['M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88'],
  check:  'M4.5 12.75l6 6 9-13.5',
  camera: ['M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z', 'M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z'],
  trash:  ['M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'],
}

function SaveButton({ onSave, saved }) {
  return (
    <button onClick={onSave}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        saved ? 'bg-green-600 text-white' : 'bg-[#3A5A40] text-white hover:bg-[#2f4a34]'
      }`}>
      {saved ? <><Icon d={IC.check} size={14} /> Saved</> : 'Save changes'}
    </button>
  )
}

function SettingsBody() {
  const stored = (() => { try { return JSON.parse(localStorage.getItem('current_user')) } catch { return null } })() || {}
  const fileRef = useRef(null)
  const [name, setName]     = useState(stored.name || '')
  const [email, setEmail]   = useState(stored.email || '')
  const [phone, setPhone]   = useState(stored.phone || '')
  const [avatar, setAvatar] = useState(stored.avatar || null)
  const [saved, setSaved]   = useState(false)

  // password change
  const [show, setShow]       = useState({ cur: false, nw: false, cf: false })
  const [cur, setCur]         = useState('')
  const [nw, setNw]           = useState('')
  const [cf, setCf]           = useState('')
  const [pwErr, setPwErr]     = useState('')
  const [pwSaved, setPwSaved] = useState(false)
  const [pErr, setPErr]       = useState('')
  const [delOpen, setDelOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await deleteAccount()
      localStorage.removeItem('token')
      localStorage.removeItem('current_user')
      window.location.href = '/login'
    } catch {
      setDeleting(false)
    }
  }
  const toggle = (k) => setShow(p => ({ ...p, [k]: !p[k] }))

  const initials = (name || 'U').trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const roleLabel = stored.role === 'admin' ? 'Administrator' : (stored.role ? stored.role[0].toUpperCase() + stored.role.slice(1) : 'User')

  const handleAvatar = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setAvatar(ev.target.result)
    reader.readAsDataURL(file)
  }

  const save = async () => {
    setPErr('')
    try {
      const res = await updateProfile({ name, email, phone, avatar })
      localStorage.setItem('current_user', JSON.stringify({ ...stored, ...res.data }))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setPErr(e.response?.data?.message || e.response?.data?.errors?.email?.[0] || 'Failed to save profile.')
    }
  }

  const savePassword = async () => {
    if (!cur) return setPwErr('Enter your current password.')
    if (nw.length < 6) return setPwErr('New password must be at least 6 characters.')
    if (nw !== cf) return setPwErr('Passwords do not match.')
    setPwErr('')
    try {
      await updatePassword({ current_password: cur, password: nw })
      setPwSaved(true)
      setCur(''); setNw(''); setCf('')
      setTimeout(() => setPwSaved(false), 2500)
    } catch (e) {
      setPwErr(e.response?.data?.message || 'Failed to update password.')
    }
  }

  const inputCls = 'w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition'
  const pwFields = [
    { label: 'Current Password',     value: cur, set: setCur, key: 'cur' },
    { label: 'New Password',         value: nw,  set: setNw,  key: 'nw'  },
    { label: 'Confirm New Password', value: cf,  set: setCf,  key: 'cf'  },
  ]

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="border border-slate-200 rounded-xl p-6 bg-white">
        <div className="mb-6">
          <h3 className="text-base font-bold text-slate-800">My Profile</h3>
          <p className="text-sm text-slate-400 mt-0.5">Your personal account details as the workspace owner.</p>
        </div>

        <div className="space-y-6">
          {/* Avatar + identity */}
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => fileRef.current?.click()} title="Change photo"
              className="relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ring-2 ring-slate-100 group"
              style={{ backgroundColor: avatar ? undefined : '#3A5A40' }}>
              {avatar
                ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                : <span className="text-white text-xl font-bold">{initials}</span>}
              <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Icon d={IC.camera} size={20} className="text-white" />
              </span>
            </button>
            <div className="min-w-0">
              <p className="text-base font-bold text-slate-800 truncate">{name || 'Your Name'}</p>
              <p className="text-sm text-slate-400 truncate">{roleLabel}</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </div>

          {/* Name + Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+92 300 1234567" className={inputCls} />
          </div>

          {pErr && <p className="text-xs text-red-500 font-medium">{pErr}</p>}
          <div className="flex justify-end">
            <SaveButton onSave={save} saved={saved} />
          </div>
        </div>
      </div>

      {/* Change Password card */}
      <div className="border border-slate-200 rounded-xl p-6 bg-white">
        <h4 className="text-sm font-bold text-slate-800">Change Password</h4>
        <p className="text-xs text-slate-400 mt-0.5 mb-4">Use a strong, unique password.</p>
        <div className="space-y-4">
          {pwFields.map(f => (
            <div key={f.key}>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{f.label}</label>
              <div className="relative">
                <input type={show[f.key] ? 'text' : 'password'} value={f.value} onChange={e => f.set(e.target.value)} placeholder="••••••••"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 transition placeholder:text-slate-300" />
                <button type="button" onClick={() => toggle(f.key)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  <Icon d={show[f.key] ? IC.eyeOff : IC.eye} size={15} />
                </button>
              </div>
            </div>
          ))}
          {nw && cf && nw !== cf && <p className="text-xs text-red-500 font-medium">Passwords do not match.</p>}
          {nw.length > 0 && nw.length < 6 && <p className="text-xs text-amber-600 font-medium">At least 6 characters required.</p>}
          {pwErr && <p className="text-xs text-red-500 font-medium">{pwErr}</p>}
        </div>
        <div className="flex justify-end mt-5">
          <SaveButton onSave={savePassword} saved={pwSaved} />
        </div>
      </div>

      {/* Danger zone: delete account */}
      <div className="border border-red-200 rounded-xl p-6 bg-white">
        <h4 className="text-sm font-bold text-red-600">Delete Account</h4>
        <p className="text-xs text-slate-400 mt-0.5 mb-4">Permanently remove your account and all associated data from the system. This cannot be undone.</p>
        <button type="button" onClick={() => setDelOpen(true)}
          className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-sm font-semibold text-white transition-colors">
          Delete Account
        </button>
      </div>

      {delOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setDelOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
              <Icon d={IC.trash} size={20} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Delete your account?</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">This permanently removes your account and all associated data. This action cannot be undone.</p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDelOpen(false)} disabled={deleting}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-sm font-semibold text-white transition-colors">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  return (
    <AppShell role="admin" activePage="Settings">
      <div className="pb-16 max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
          <p className="text-sm text-slate-400 mt-0.5">Manage your account and preferences.</p>
        </div>
        <SettingsBody />
      </div>
    </AppShell>
  )
}
