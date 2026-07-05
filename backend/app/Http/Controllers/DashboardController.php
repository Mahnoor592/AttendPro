<?php

namespace App\Http\Controllers;

use App\Http\Resources\AttendanceLogResource;
use App\Models\AttendanceLog;
use App\Models\User;

class DashboardController extends Controller
{
    public function index()
    {
        $today = today();

        $total   = User::where('role', 'employee')->where('is_active', true)->count();
        $present = AttendanceLog::where('type', 'check_in')
            ->whereDate('timestamp', $today)
            ->where('is_valid', true)
            ->distinct('employee_id')
            ->count('employee_id');

        $late   = AttendanceLog::where('type', 'check_in')
            ->whereDate('timestamp', $today)
            ->where('flag', 'late')
            ->count();

        $absent = max(0, $total - $present);

        $recentLogs = AttendanceLog::with(['employee', 'branch'])
            ->whereDate('timestamp', $today)
            ->orderBy('timestamp', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'total'       => $total,
            'present'     => $present,
            'late'        => $late,
            'absent'      => $absent,
            'recent_logs' => AttendanceLogResource::collection($recentLogs),
            'anomalies'   => $this->anomalies(),
        ]);
    }

    private function anomalies(): array
    {
        $anomalies = [];

        // Missing check-outs today
        $checkedIn = AttendanceLog::with('employee')
            ->where('type', 'check_in')
            ->whereDate('timestamp', today())
            ->get();

        foreach ($checkedIn as $log) {
            $hasOut = AttendanceLog::where('employee_id', $log->employee_id)
                ->where('type', 'check_out')
                ->whereDate('timestamp', today())
                ->exists();

            if (!$hasOut) {
                $anomalies[] = [
                    'type'    => 'missing_checkout',
                    'message' => ($log->employee->name ?? 'Unknown') . ' — missing check-out',
                ];
            }
        }

        // 3+ late check-ins
        $lateIds = AttendanceLog::select('employee_id')
            ->where('type', 'check_in')
            ->where('flag', 'late')
            ->groupBy('employee_id')
            ->havingRaw('COUNT(*) >= 3')
            ->pluck('employee_id');

        foreach (User::whereIn('id', $lateIds)->get() as $user) {
            $anomalies[] = [
                'type'    => 'consecutive_late',
                'message' => $user->name . ' — 3+ late check-ins',
            ];
        }

        return $anomalies;
    }
}
