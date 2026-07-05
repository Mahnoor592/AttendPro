# Smart Attendance Management System — CLAUDE.md

DBMS Lab Project. Geofence-based employee attendance system with GPS validation, role-based dashboards, shift scheduling, and email notifications.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React (Vite) + Tailwind CSS | SPA — all UIs, forms, dashboards, role-based routing |
| Backend / API | Laravel 13 | REST API, business logic, geofence math, auth, email |
| Database | MySQL | All persistent data |
| Authentication | Laravel Sanctum | Token-based auth for React SPA |
| Email | Laravel Mail + Mailtrap (dev) | Shift assignment, request approval/denial notifications |
| Maps | Leaflet.js | Visual geofence circle on branch settings page |
| GPS | Browser Geolocation API | Capture employee coordinates on check-in/out |

---

## User Roles

- **admin** — full access: branches, employees, schedules, settings, reports
- **hr** — attendance records, schedule assignment, shift request approval, reports
- **employee** — clock in/out, own records, own schedule (read-only), shift change requests

Single login page for all roles. After login, role determines layout and nav.

---

## Pages

### Admin / HR Panel
| Page | Purpose |
|---|---|
| Today (Dashboard) | Stat cards: total/present/late/absent. Anomaly feed. Live activity log. |
| Employees | CRUD, branch assignment, activate/deactivate, filter by branch/role |
| Branches | CRUD + Leaflet.js map with draggable pin + radius slider for geofence |
| Schedule | Weekly Mon–Sun board, employee rows, click cell to assign shift, email fires on assign |
| Attendance | Full log, filters by employee/branch/date/flag, heatmap calendar, working hours summary |
| Shift Requests | Pending requests list, approve/deny with reason, email sent on decision |
| Settings | Company name/logo, geofence buffer tolerance, email toggles, change password |

### Employee Panel (minimal layout — no sidebar)
| Page | Purpose |
|---|---|
| Today (Workspace) | Live ticking clock, today's shift card, status badge, hours progress bar, clock-in/out button |
| Attendance | Personal history table: date, check-in, check-out, hours, flag |
| My Schedule | Read-only weekly shift view |
| My Requests | Submit shift change request + list of own requests with status |

---

## Database Schema

```
users               id, name, email, password, role, branch_id, is_active
branches            id, name, address, lat, lng, radius_meters, shift_start, shift_end
schedules           id, employee_id, branch_id, day_of_week, shift_start, shift_end, week_start_date
attendance_logs     id, employee_id, branch_id, type(check_in/check_out), gps_lat, gps_lng,
                    readable_address, timestamp, is_valid, flag(on_time/late/early_departure), working_hours
shift_requests      id, employee_id, schedule_id, reason, status(pending/approved/denied),
                    reviewed_by, reviewed_at, response_note
settings            id, key, value
```

DBMS extras:
- MySQL View: `attendance_summary_view` (joins users + attendance_logs + branches)
- Stored Procedure: `get_monthly_summary(employee_id, month, year)`
- Indexes: on `attendance_logs(employee_id, timestamp)`
- Foreign keys with cascade rules on all relationships

---

## Backend Structure (Laravel 13)

```
attendance-backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php
│   │   │   ├── BranchController.php
│   │   │   ├── EmployeeController.php
│   │   │   ├── AttendanceController.php
│   │   │   ├── ScheduleController.php
│   │   │   ├── ShiftRequestController.php
│   │   │   ├── DashboardController.php
│   │   │   └── SettingsController.php
│   │   ├── Middleware/
│   │   │   └── RoleMiddleware.php
│   │   ├── Requests/
│   │   │   ├── CheckInRequest.php
│   │   │   ├── CreateEmployeeRequest.php
│   │   │   └── CreateBranchRequest.php
│   │   └── Resources/
│   │       ├── UserResource.php
│   │       ├── AttendanceLogResource.php
│   │       ├── BranchResource.php
│   │       ├── ScheduleResource.php
│   │       └── ShiftRequestResource.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Branch.php
│   │   ├── Schedule.php
│   │   ├── AttendanceLog.php
│   │   ├── ShiftRequest.php
│   │   └── Setting.php
│   ├── Services/
│   │   ├── AttendanceService.php
│   │   ├── GeofenceService.php
│   │   └── ReportService.php
│   └── Mail/
│       ├── ShiftAssigned.php
│       ├── ShiftUpdated.php
│       ├── ShiftRequestSubmitted.php
│       └── ShiftRequestDecision.php
├── database/
│   ├── migrations/
│   └── seeders/
└── routes/
    └── api.php
```

---

## Backend Patterns

### Rule: Thin controllers, logic in Services
Controllers only validate input and call the service. All business logic (Haversine, flag assignment, anomaly detection, duplicate prevention) lives in Service classes.

### API Routes pattern (routes/api.php)
```php
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::middleware('role:admin')->group(function () {
        Route::apiResource('employees', EmployeeController::class);
        Route::apiResource('branches', BranchController::class);
        Route::put('settings', [SettingsController::class, 'update']);
    });

    Route::middleware('role:admin,hr')->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index']);
        Route::apiResource('schedules', ScheduleController::class);
        Route::get('attendance', [AttendanceController::class, 'index']);
        Route::get('attendance/anomalies', [AttendanceController::class, 'anomalies']);
        Route::get('shift-requests', [ShiftRequestController::class, 'index']);
        Route::put('shift-requests/{id}', [ShiftRequestController::class, 'decide']);
    });

    Route::middleware('role:employee')->group(function () {
        Route::post('attendance/checkin',  [AttendanceController::class, 'checkIn']);
        Route::post('attendance/checkout', [AttendanceController::class, 'checkOut']);
        Route::get('attendance/mine',      [AttendanceController::class, 'mine']);
        Route::get('schedule/mine',        [ScheduleController::class, 'mine']);
        Route::post('shift-requests',      [ShiftRequestController::class, 'store']);
        Route::get('shift-requests/mine',  [ShiftRequestController::class, 'mine']);
    });
});
```

### Role Middleware (app/Http/Middleware/RoleMiddleware.php)
```php
public function handle(Request $request, Closure $next, string ...$roles): Response
{
    if (!in_array($request->user()?->role, $roles)) {
        return response()->json(['message' => 'Forbidden'], 403);
    }
    return $next($request);
}
```
Register alias `role` in `bootstrap/app.php`.

### Haversine Formula (in AttendanceService)
```php
private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
{
    $R = 6371000;
    $dLat = deg2rad($lat2 - $lat1);
    $dLng = deg2rad($lng2 - $lng1);
    $a = sin($dLat/2)**2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng/2)**2;
    return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
}
```
Geofence validation always runs server-side. Never trust client-side GPS validation.

### CORS (config/cors.php)
```php
'paths'           => ['api/*'],
'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:5173')],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
```

---

## Frontend Structure (React + Vite)

```
attendance-frontend/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── admin/
│   │   │   ├── Today.jsx
│   │   │   ├── Employees.jsx
│   │   │   ├── Branches.jsx
│   │   │   ├── Schedule.jsx
│   │   │   ├── Attendance.jsx
│   │   │   ├── ShiftRequests.jsx
│   │   │   └── Settings.jsx
│   │   ├── hr/
│   │   │   ├── Today.jsx
│   │   │   ├── Attendance.jsx
│   │   │   ├── Schedule.jsx
│   │   │   └── ShiftRequests.jsx
│   │   └── employee/
│   │       ├── Today.jsx
│   │       ├── Attendance.jsx
│   │       ├── Schedule.jsx
│   │       └── Requests.jsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.jsx          (sidebar + topbar for admin/hr)
│   │   │   └── EmployeeShell.jsx     (minimal top nav for employee)
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── StatCard.jsx
│   │   │   └── Toast.jsx
│   │   ├── today/
│   │   │   ├── LiveClock.jsx
│   │   │   ├── ShiftCard.jsx
│   │   │   └── WorkingProgressBar.jsx
│   │   ├── attendance/
│   │   │   ├── ClockInButton.jsx
│   │   │   ├── AttendanceTable.jsx
│   │   │   ├── HeatmapCalendar.jsx
│   │   │   └── AnomalyFeed.jsx
│   │   ├── schedule/
│   │   │   ├── WeeklyBoard.jsx
│   │   │   └── ShiftCell.jsx
│   │   └── branches/
│   │       └── GeofenceMap.jsx
│   ├── store/
│   │   ├── index.js
│   │   ├── hooks.js
│   │   └── slices/
│   │       ├── authSlice.js
│   │       ├── attendanceSlice.js
│   │       ├── scheduleSlice.js
│   │       └── uiSlice.js
│   ├── api/
│   │   ├── client.js               (Axios instance — auth interceptor + 401 redirect)
│   │   ├── auth.js
│   │   ├── attendance.js
│   │   ├── branches.js
│   │   ├── employees.js
│   │   ├── schedules.js
│   │   └── shiftRequests.js
│   ├── hooks/
│   │   ├── useGeolocation.js       (GPS capture + reverse geocoding via Nominatim)
│   │   └── useLiveClock.js         (1-second interval clock state)
│   └── router/
│       ├── ProtectedRoute.jsx      (auth + role check wrapper)
│       └── routes.jsx
├── vite.config.js
└── tailwind.config.js
```

---

## Frontend Patterns

### Axios Client (src/api/client.js)
Single Axios instance used by all API modules. Auth token auto-attached. 401 auto-redirects to login.
```js
const client = axios.create({ baseURL: import.meta.env.VITE_API_URL });
client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});
client.interceptors.response.use(
    r => r,
    err => {
        if (err.response?.status === 401) {
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);
```

### Redux Auth Slice (store/slices/authSlice.js)
Stores user object, token, role. Hydrates from localStorage on app load.
```js
initialState: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
}
// login thunk: POST /api/login → set localStorage + Redux
// logout reducer: clear localStorage + Redux
```

### Protected Route (router/ProtectedRoute.jsx)
```jsx
export default function ProtectedRoute({ children, roles }) {
    const { user, token } = useAppSelector(s => s.auth);
    if (!token || !user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
    return children;
}
```

### After Login — role-based redirect
```js
// in login handler after dispatch succeeds:
if (user.role === 'admin')    navigate('/admin/today');
if (user.role === 'hr')       navigate('/hr/today');
if (user.role === 'employee') navigate('/employee/today');
```

### GPS + Reverse Geocode (hooks/useGeolocation.js)
```js
const getLocationWithAddress = async () => {
    const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
    );
    const { latitude, longitude } = pos.coords;
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
    const data = await res.json();
    return { gps_lat: latitude, gps_lng: longitude, readable_address: data.display_name };
};
```

---

## Auth Flow (end-to-end)

```
1. POST /api/login → Laravel returns { user, token }
2. React stores token + user in localStorage + Redux state
3. All API calls: client.js interceptor auto-adds Authorization: Bearer {token}
4. Laravel auth:sanctum validates token → sets $request->user()
5. role middleware checks user->role against allowed roles for that route
6. On 401 response → client.js interceptor clears storage + redirects to /login
```

---

## Today Page — What Each Role Sees

### Admin / HR Today
- **4 stat cards (top row):** Total Employees | Present Now | Late Today | Absent
- **Anomaly Feed (left):** auto-refreshes every 30s — rejected GPS attempts, 3+ consecutive lates, missing check-outs
- **Live Activity Log (right):** timestamped list of today's check-ins/outs

Backend endpoint: `GET /api/dashboard`
Returns: `{ total, present, late, absent, anomalies[], recent_logs[] }`

### Employee Today (Workspace)
```
[ 09:34:22 AM  —  Wednesday 21 May 2026 ]     ← live ticking clock (useLiveClock hook)

  Today's Shift
  ┌────────────────────────────────────────┐
  │  Lahore Office    9:00 AM – 5:00 PM   │
  └────────────────────────────────────────┘

  Status:  🟢 Working since 9:02 AM
  ████████░░░░  0h 32m / 8h worked today

              ╔══════════════╗
              ║  CHECK OUT   ║   ← large round button, green=check in, red=check out
              ╚══════════════╝

  "Checked out at 5:01 PM — 15 Main Blvd, Lahore"
```

---

## Email Notification Triggers

| Event | Recipient | When |
|---|---|---|
| Shift assigned | Employee | HR saves schedule for employee |
| Shift updated | Employee | HR edits existing assignment |
| Shift request submitted | HR Manager | Employee submits request |
| Shift request approved | Employee | HR clicks approve |
| Shift request denied | Employee | HR clicks deny (reason included) |

Use Laravel Mailable classes. Mailtrap.io for dev (no real emails sent).

---

## UI Design Decisions (locked in)

- **Admin/HR sidebar:** dark navy `#0f172a`, muted text `#94a3b8`, white when active
- **Content area bg:** off-white `#f8fafc`
- **Primary accent:** teal `#0d9488` for buttons, active states, highlights
- **Status colors:** green `#16a34a` on-time | amber `#d97706` late | red `#dc2626` absent/rejected
- **Font:** Inter
- **Employee panel:** NO sidebar — centered card layout, minimal top nav only
- **Clock-in button:** large circle (like a physical time-clock), prominent
- **Schedule board:** spreadsheet-style grid, colored shift pills per branch
- **Heatmap:** GitHub contribution graph style (deep green = full, grey = absent)
- **Do NOT copy GriddleOS UI** — that project uses orange (#FF6B35) brand color and a different nav structure

---

## Key Locked-In Decisions

- Geofence validation is **always server-side** (Haversine in Laravel) — never trust client GPS math
- Employee **cannot edit** their own schedule — submit a shift change request instead
- Reverse geocoding uses **OpenStreetMap Nominatim** (free, no API key)
- Token stored in **localStorage** (not cookies) for simplicity in SPA
- All JSON responses go through **API Resource** classes — never raw `$model->toArray()`
- **Mailtrap** for dev email — swap SMTP config for production

---

## Build Order

1. Laravel: migrations → seeders → `php artisan install:api` → CORS config
2. Auth API + React login page + token flow + role redirect
3. Branch CRUD + Leaflet geofence map
4. Employee CRUD + branch assignment
5. Clock-in/out: GPS in React → geofence in Laravel → flags
6. Today page (all 3 roles)
7. Schedule board: weekly grid + assign endpoint + email on assign
8. Shift requests: employee form + HR approve/deny + emails
9. Attendance reports: filtered table + anomaly feed + heatmap calendar
10. Settings page
11. MySQL View + Stored Procedure (DBMS lab marks)
12. Polish: loading states, error messages, mobile responsiveness

---

## Environment Variables

```env
# Frontend (.env)
VITE_API_URL=http://localhost:8000/api

# Backend (.env)
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
DB_CONNECTION=mysql
DB_DATABASE=attendance_db
DB_USERNAME=root
DB_PASSWORD=
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=           # from Mailtrap dashboard
MAIL_PASSWORD=           # from Mailtrap dashboard
```

## Install Commands

```bash
# Backend
composer create-project laravel/laravel attendance-backend
cd attendance-backend
php artisan install:api

# Frontend
npm create vite@latest attendance-frontend -- --template react
cd attendance-frontend
npm install react-router-dom @reduxjs/toolkit react-redux axios
npm install leaflet react-leaflet
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
