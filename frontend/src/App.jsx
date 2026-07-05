import { Routes, Route, Navigate } from 'react-router-dom'
import Login                from './pages/Login'
import Signup               from './pages/Signup'
import ManagerToday         from './pages/admin/Today'
import ManagerEmployees     from './pages/admin/Employees'
import ManagerBranches      from './pages/admin/Branches'
import ManagerSchedule      from './pages/admin/Schedule'
import ManagerAttendance    from './pages/admin/Attendance'
import ManagerShiftRequests from './pages/admin/ShiftRequests'
import ManagerSettings      from './pages/admin/Settings'
import EmployeeToday        from './pages/employee/Today'
import EmployeeWork         from './pages/employee/Work'
import ProtectedRoute       from './router/ProtectedRoute'
import { getCurrentUser }   from './utils/auth'

function RootRedirect() {
    const user = getCurrentUser()
    if (!user) return <Navigate to="/login" replace />
    if (user.role === 'admin') return <Navigate to="/admin/today" replace />
    return <Navigate to="/employee/today" replace />
}

export default function App() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/"       element={<RootRedirect />} />
            <Route path="/login"  element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Admin */}
            <Route path="/admin/today" element={
                <ProtectedRoute role="admin"><ManagerToday /></ProtectedRoute>
            } />
            <Route path="/admin/employees" element={
                <ProtectedRoute role="admin"><ManagerEmployees /></ProtectedRoute>
            } />
            <Route path="/admin/branches" element={
                <ProtectedRoute role="admin"><ManagerBranches /></ProtectedRoute>
            } />
            <Route path="/admin/schedule" element={
                <ProtectedRoute role="admin"><ManagerSchedule /></ProtectedRoute>
            } />
            <Route path="/admin/attendance" element={
                <ProtectedRoute role="admin"><ManagerAttendance /></ProtectedRoute>
            } />
            <Route path="/admin/shift-requests" element={
                <ProtectedRoute role="admin"><ManagerShiftRequests /></ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
                <ProtectedRoute role="admin"><ManagerSettings /></ProtectedRoute>
            } />

            {/* Employee — Clock In station + My Work (tabs) */}
            <Route path="/employee/today" element={
                <ProtectedRoute role="employee"><EmployeeToday /></ProtectedRoute>
            } />
            <Route path="/employee/work" element={
                <ProtectedRoute role="employee"><EmployeeWork /></ProtectedRoute>
            } />
            <Route path="/employee/attendance" element={<Navigate to="/employee/work" replace />} />
            <Route path="/employee/schedule"   element={<Navigate to="/employee/work" replace />} />
            <Route path="/employee/requests"   element={<Navigate to="/employee/work" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}
