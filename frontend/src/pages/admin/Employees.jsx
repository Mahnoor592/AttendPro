import { useState, useEffect, useRef } from 'react'
import AppShell from '../../components/layout/AppShell'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../../api/employees'
import { getBranches } from '../../api/branches'

const AVATAR_COLORS = ['bg-[#1a2e2a]', 'bg-slate-600', 'bg-slate-700', 'bg-slate-500', 'bg-slate-800', 'bg-slate-900']
function initials(name) { return (name || '?').trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) }
function avatarBg(name) { return AVATAR_COLORS[(name || '').charCodeAt(0) % AVATAR_COLORS.length] }

function Icon({ d, size = 16, className = '' }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
            {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
        </svg>
    )
}
const IC = {
    search: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
    plus:   'M12 4.5v15m7.5-7.5h-15',
    edit:   'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125',
    trash:  ['M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'],
    x:      'M6 18L18 6M6 6l12 12',
    users:  'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    check:  'M4.5 12.75l6 6 9-13.5',
}

function Modal({ onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
                {children}
            </div>
        </div>
    )
}

function EmployeeForm({ title, subtitle, initial, branches, onSave, onClose, isEdit }) {
    const [form, setForm] = useState({ phone: '', address: '', position: '', avatar: null, ...initial })
    const [saving, setSaving] = useState(false)
    const [err, setErr] = useState('')
    const fileRef = useRef(null)
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
    const handleAvatar = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = ev => set('avatar', ev.target.result)
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setErr('')
        const result = await onSave(form)
        setSaving(false)
        if (result?.error) setErr(result.error)
    }

    return (
        <Modal onClose={onClose}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
                <div>
                    <h2 className="text-base font-bold text-slate-800">{title}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                    <Icon d={IC.x} size={16} />
                </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {err && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}
                <div className="flex items-center gap-3 mb-1">
                    <button type="button" onClick={() => fileRef.current?.click()}
                        className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${form.avatar ? '' : avatarBg(form.name || 'A')}`}>
                        {form.avatar
                            ? <img src={form.avatar} alt="" className="w-full h-full object-cover" />
                            : <span className="text-white text-sm font-bold">{form.name ? initials(form.name) : '?'}</span>}
                    </button>
                    <div>
                        <p className="text-sm font-semibold text-slate-700">{form.name || 'New Employee'}</p>
                        <button type="button" onClick={() => fileRef.current?.click()}
                            className="text-xs font-semibold text-teal-600 hover:text-teal-700">
                            {form.avatar ? 'Change photo' : 'Upload photo'}
                        </button>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Full Name</label>
                    <input required type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Fatima Ali"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Email Address</label>
                    <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="fatima@company.com"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Phone Number</label>
                    <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+92 300 1234567"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Role</label>
                    <input type="text" value={form.position} onChange={e => set('position', e.target.value)} placeholder="e.g. Software Engineer"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Password {isEdit && <span className="text-slate-300">(leave blank to keep)</span>}</label>
                    <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 8 characters"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Branch</label>
                    <select value={form.branch_id} onChange={e => set('branch_id', e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition">
                        <option value="">— Select Branch —</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Address</label>
                    <input type="text" value={form.address} onChange={e => set('address', e.target.value)} placeholder="House #, Street, City"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition" />
                </div>
                </div>
                {isEdit && (
                    <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1.5">Account Status</label>
                        <button type="button" onClick={() => set('is_active', !form.is_active)}
                            className={`flex items-center gap-3 w-full border rounded-lg px-3 py-2.5 transition-colors ${form.is_active ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                            <div className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${form.is_active ? 'bg-green-500' : 'bg-slate-300'}`}>
                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? 'left-4' : 'left-0.5'}`} />
                            </div>
                            <span className={`text-sm font-medium ${form.is_active ? 'text-green-700' : 'text-slate-500'}`}>
                                {form.is_active ? 'Active — can log in' : 'Inactive — login blocked'}
                            </span>
                        </button>
                    </div>
                )}
                <div className="flex gap-3 pt-1">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                    <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-[#3A5A40] hover:bg-[#2f4a34] disabled:bg-teal-300 text-sm font-semibold text-white transition-colors">
                        {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Employee'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

function ConfirmDelete({ name, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
                    <Icon d={IC.trash} size={20} className="text-red-500" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Remove Employee?</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    <span className="font-semibold text-slate-700">{name}</span> will be permanently removed.
                </p>
                <div className="flex gap-3 mt-5">
                    <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                    <button onClick={onConfirm} className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-sm font-semibold text-white transition-colors">Remove</button>
                </div>
            </div>
        </div>
    )
}

export default function EmployeesPage() {
    const [employees, setEmployees]   = useState([])
    const [branches, setBranches]     = useState([])
    const [loading, setLoading]       = useState(true)
    const [search, setSearch]         = useState('')
    const [branchFilter, setBranch]   = useState('all')
    const [statusFilter, setStatus]   = useState('all')
    const [addOpen, setAddOpen]       = useState(false)
    const [editTarget, setEdit]       = useState(null)
    const [deleteTarget, setDelete]   = useState(null)

    const load = () => {
        setLoading(true)
        Promise.all([getEmployees(), getBranches()])
            .then(([empRes, branchRes]) => {
                setEmployees(empRes.data.data || empRes.data)
                setBranches(branchRes.data.data || branchRes.data)
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }
    useEffect(load, [])

    const filtered = employees.filter(e => {
        const q = search.toLowerCase()
        if (q && !e.name.toLowerCase().includes(q) && !e.email.toLowerCase().includes(q)) return false
        if (branchFilter !== 'all' && String(e.branch_id) !== String(branchFilter)) return false
        if (statusFilter === 'active'   && !e.is_active) return false
        if (statusFilter === 'inactive' &&  e.is_active) return false
        return true
    })

    const total  = employees.length
    const active = employees.filter(e => e.is_active).length

    const handleAdd = async (form) => {
        if (!form.branch_id) return { error: 'Please select a branch.' }
        if (!form.password)  return { error: 'Password is required.' }
        try {
            await createEmployee(form)
            setAddOpen(false)
            load()
        } catch (err) {
            return { error: err.response?.data?.message || 'Failed to create employee.' }
        }
    }

    const handleUpdate = async (form) => {
        try {
            await updateEmployee(form.id, form)
            setEdit(null)
            load()
        } catch (err) {
            return { error: err.response?.data?.message || 'Failed to update employee.' }
        }
    }

    const handleDelete = async () => {
        try {
            await deleteEmployee(deleteTarget)
            setDelete(null)
            load()
        } catch {}
    }

    const getBranchName = (emp) => {
        if (emp.branch?.name) return emp.branch.name
        const b = branches.find(br => br.id === emp.branch_id)
        return b?.name || '—'
    }

    return (
        <AppShell role="admin" activePage="Employees">
            <div className="space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Employees</h1>
                            <p className="text-sm text-slate-400 mt-0.5">{total} total · {active} active</p>
                        </div>
                    </div>
                    <button onClick={() => setAddOpen(true)}
                        className="flex items-center gap-2 bg-[#3A5A40] hover:bg-[#2f4a34] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
                        <Icon d={IC.plus} size={15} />
                        Add Employee
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-52">
                        <Icon d={IC.search} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition placeholder:text-slate-300" />
                    </div>
                    <select value={branchFilter} onChange={e => setBranch(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-teal-200 transition">
                        <option value="all">All Branches</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <select value={statusFilter} onChange={e => setStatus(e.target.value)}
                        className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-teal-200 transition">
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Employee</th>
                                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-4 hidden md:table-cell">Branch</th>
                                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-4 hidden lg:table-cell">Role</th>
                                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-4">Status</th>
                                <th className="px-6 py-4" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-16 text-sm text-slate-400">Loading…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-16">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                                                <Icon d={IC.users} size={22} className="text-slate-300" />
                                            </div>
                                            <p className="text-sm font-semibold text-slate-400">No employees found</p>
                                            <p className="text-xs text-slate-300">Try adjusting your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.map(emp => (
                                <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${emp.avatar ? '' : avatarBg(emp.name)}`}>
                                                {emp.avatar
                                                    ? <img src={emp.avatar} alt="" className="w-full h-full object-cover" />
                                                    : <span className="text-white text-xs font-bold">{initials(emp.name)}</span>}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-800 truncate">{emp.name}</p>
                                                <p className="text-xs text-slate-400 truncate">{emp.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 hidden md:table-cell">
                                        <span className="text-sm text-slate-600">{getBranchName(emp)}</span>
                                    </td>
                                    <td className="px-4 py-4 hidden lg:table-cell">
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100 capitalize">
                                            {emp.position || emp.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${emp.is_active ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${emp.is_active ? 'bg-green-500' : 'bg-slate-400'}`} />
                                            {emp.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setEdit(emp)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors" title="Edit">
                                                <Icon d={IC.edit} size={14} />
                                            </button>
                                            <button onClick={() => setDelete(emp.id)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Remove">
                                                <Icon d={IC.trash} size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filtered.length > 0 && (
                        <div className="px-6 py-3 border-t border-slate-100">
                            <p className="text-xs text-slate-400">Showing {filtered.length} of {total} employees</p>
                        </div>
                    )}
                </div>

            </div>

            {addOpen && (
                <EmployeeForm
                    title="Add New Employee"
                    subtitle="Fill in the details to create an account"
                    initial={{ name: '', email: '', password: '', role: 'employee', branch_id: '', is_active: true }}
                    branches={branches}
                    onSave={handleAdd}
                    onClose={() => setAddOpen(false)}
                    isEdit={false}
                />
            )}
            {editTarget && (
                <EmployeeForm
                    title="Edit Employee"
                    subtitle={`Update ${editTarget.name}'s details`}
                    initial={{ ...editTarget, password: '' }}
                    branches={branches}
                    onSave={handleUpdate}
                    onClose={() => setEdit(null)}
                    isEdit={true}
                />
            )}
            {deleteTarget && (
                <ConfirmDelete
                    name={employees.find(e => e.id === deleteTarget)?.name}
                    onConfirm={handleDelete}
                    onCancel={() => setDelete(null)}
                />
            )}
        </AppShell>
    )
}
