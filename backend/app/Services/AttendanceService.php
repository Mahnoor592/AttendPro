<?php

namespace App\Services;

use App\Models\AttendanceLog;
use App\Models\Schedule;
use App\Models\Setting;
use App\Models\User;
use Carbon\Carbon;

class AttendanceService
{
    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $R    = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a    = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    /** Number of open sessions today (valid check-ins minus check-outs). > 0 means currently checked in. */
    private function openSessions(int $employeeId): int
    {
        $ins = AttendanceLog::where('employee_id', $employeeId)
            ->where('type', 'check_in')->where('is_valid', true)
            ->whereDate('timestamp', today())->count();
        $outs = AttendanceLog::where('employee_id', $employeeId)
            ->where('type', 'check_out')
            ->whereDate('timestamp', today())->count();

        return $ins - $outs;
    }

    public function checkIn(User $employee, array $data): array
    {
        $branch = $employee->branch;

        if (!$branch) {
            return ['success' => false, 'message' => 'No branch assigned to your account.'];
        }

        // Must have a shift scheduled for today (this week) to check in.
        $hasShiftToday = Schedule::where('employee_id', $employee->id)
            ->where('day_of_week', Carbon::now()->format('l'))
            ->where('week_start_date', Carbon::now()->startOfWeek(Carbon::MONDAY)->toDateString())
            ->exists();

        if (!$hasShiftToday) {
            return ['success' => false, 'message' => 'You have no shift scheduled today, so check-in is not allowed.'];
        }

        // Block only if there is an OPEN session (checked in but not yet out).
        if ($this->openSessions($employee->id) > 0) {
            return ['success' => false, 'message' => 'You are already checked in. Check out first.'];
        }

        $distance      = $this->haversine($data['gps_lat'], $data['gps_lng'], $branch->lat, $branch->lng);
        $buffer        = (int) Setting::get('geofence_buffer', 0);
        $allowedRadius = $branch->radius_meters + $buffer;

        if ($distance > $allowedRadius) {
            AttendanceLog::create([
                'employee_id'      => $employee->id,
                'branch_id'        => $branch->id,
                'type'             => 'check_in',
                'gps_lat'          => $data['gps_lat'],
                'gps_lng'          => $data['gps_lng'],
                'readable_address' => $branch->address,
                'timestamp'        => Carbon::now(),
                'is_valid'         => false,
            ]);

            return [
                'success' => false,
                'message' => 'You are ' . round($distance) . 'm away. Must be within ' . $allowedRadius . 'm of ' . $branch->name . '.',
            ];
        }

        $now        = Carbon::now();
        $shiftStart = Carbon::today()->setTimeFromTimeString($branch->shift_start);
        $flag       = $now->gt($shiftStart) ? 'late' : 'on_time';

        $log = AttendanceLog::create([
            'employee_id'      => $employee->id,
            'branch_id'        => $branch->id,
            'type'             => 'check_in',
            'gps_lat'          => $data['gps_lat'],
            'gps_lng'          => $data['gps_lng'],
            'readable_address' => $data['readable_address'] ?? null,
            'timestamp'        => $now,
            'is_valid'         => true,
            'flag'             => $flag,
        ]);

        return ['success' => true, 'log' => $log, 'flag' => $flag];
    }

    public function checkOut(User $employee, array $data): array
    {
        $branch = $employee->branch;

        if (!$branch) {
            return ['success' => false, 'message' => 'No branch assigned to your account.'];
        }

        if ($this->openSessions($employee->id) <= 0) {
            return ['success' => false, 'message' => 'You are not currently checked in.'];
        }

        // Check out against the most recent open check-in.
        $checkIn = AttendanceLog::where('employee_id', $employee->id)
            ->where('type', 'check_in')
            ->whereDate('timestamp', today())
            ->where('is_valid', true)
            ->orderBy('timestamp', 'desc')
            ->first();

        $distance      = $this->haversine($data['gps_lat'], $data['gps_lng'], $branch->lat, $branch->lng);
        $buffer        = (int) Setting::get('geofence_buffer', 0);
        $allowedRadius = $branch->radius_meters + $buffer;

        if ($distance > $allowedRadius) {
            return [
                'success' => false,
                'message' => 'You are ' . round($distance) . 'm away. Must be within ' . $allowedRadius . 'm of ' . $branch->name . '.',
            ];
        }

        $now      = Carbon::now();
        $shiftEnd = Carbon::today()->setTimeFromTimeString($branch->shift_end);
        $flag     = $now->lt($shiftEnd) ? 'early_departure' : null;

        $workingHours = round($checkIn->timestamp->diffInMinutes($now) / 60, 2);

        $log = AttendanceLog::create([
            'employee_id'      => $employee->id,
            'branch_id'        => $branch->id,
            'type'             => 'check_out',
            'gps_lat'          => $data['gps_lat'],
            'gps_lng'          => $data['gps_lng'],
            'readable_address' => $data['readable_address'] ?? null,
            'timestamp'        => $now,
            'is_valid'         => true,
            'flag'             => $flag,
            'working_hours'    => $workingHours,
        ]);

        return ['success' => true, 'log' => $log, 'working_hours' => $workingHours];
    }
}
