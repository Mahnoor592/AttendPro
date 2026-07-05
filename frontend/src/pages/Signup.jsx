import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUp } from '../utils/auth'
import AuthShell from '../components/layout/AuthShell'

function EyeIcon({ open }) {
  return open
    ? <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    : <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
}

function CheckIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 12.75l6 6 9-13.5" /></svg>
}

function PasswordRule({ met, text }) {
  return (
    <div className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${met ? 'text-teal-600' : 'text-slate-400'}`}>
      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${met ? 'bg-teal-500 text-white' : 'bg-slate-200'}`}>
        {met && <CheckIcon />}
      </span>
      {text}
    </div>
  )
}

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw]   = useState(false)
  const [showCf, setShowCf]   = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError('') }

  const rules = {
    length: form.password.length >= 6,
    match:  form.password.length > 0 && form.password === form.confirm,
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!rules.length) { setError('Password must be at least 6 characters.'); return }
    if (!rules.match)  { setError('Passwords do not match.'); return }
    setLoading(true)
    const result = await signUp({ name: form.name.trim(), email: form.email.trim(), password: form.password })
    setLoading(false)
    if (result.error) { setError(result.error); return }
    navigate('/admin/today')
  }

  return (
    <AuthShell>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Create your account</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1.5">Full Name</label>
          <input
            type="text" required autoComplete="name"
            value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="e.g. Sarah Ahmed"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition"
          />
        </div>

        {/* Email */}
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1.5">Email</label>
          <input
            type="email" required autoComplete="email"
            value={form.email} onChange={e => set('email', e.target.value)}
            placeholder="you@company.com"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition"
          />
        </div>

        {/* Password */}
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'} required autoComplete="new-password"
              value={form.password} onChange={e => set('password', e.target.value)}
              placeholder="Create a password"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition"
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              <EyeIcon open={showPw} />
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1.5">Confirm Password</label>
          <div className="relative">
            <input
              type={showCf ? 'text' : 'password'} required autoComplete="new-password"
              value={form.confirm} onChange={e => set('confirm', e.target.value)}
              placeholder="Re-enter password"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition"
            />
            <button type="button" onClick={() => setShowCf(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              <EyeIcon open={showCf} />
            </button>
          </div>
        </div>

        {/* Password rules */}
        {(form.password || form.confirm) && (
          <div className="flex gap-4 pt-0.5">
            <PasswordRule met={rules.length} text="At least 6 characters" />
            <PasswordRule met={rules.match}  text="Passwords match" />
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-red-500 font-medium bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Submit */}
        <button type="submit" disabled={loading}
          className="w-full bg-[#3A5A40] hover:bg-[#2f4a34] disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account…</>
            : 'Create Manager Account'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-teal-600 font-semibold hover:text-teal-700 transition-colors">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
