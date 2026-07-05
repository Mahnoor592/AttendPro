import { Navigate } from 'react-router-dom'
import { getCurrentUser } from '../utils/auth'

export default function ProtectedRoute({ children, role }) {
    const user = getCurrentUser()
    if (!user) return <Navigate to="/login" replace />

    if (role === 'admin' && user.role !== 'admin') {
        return <Navigate to="/employee/today" replace />
    }
    if (role === 'employee' && user.role !== 'employee') {
        return <Navigate to="/admin/today" replace />
    }
    return children
}
