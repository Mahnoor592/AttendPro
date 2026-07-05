<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckInRequest;
use App\Http\Resources\AttendanceLogResource;
use App\Models\AttendanceLog;
use App\Models\User;
use App\Services\AttendanceService;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(private AttendanceService $service) {}

    public function checkIn(CheckInRequest $request)
    {
        $result = $this->service->checkIn($request->user(), $request->validated());

        if (!$result['success']) {
            return response()->json(['message' => $result['message']], 422);
        }

        return response()->json([
            'message' => 'Checked in successfully.',
            'flag'    => $result['flag'],
            'log'     => new AttendanceLogResource($result['log']),
        ]);
    }

    public function checkOut(CheckInRequest $request)
    {
        $result = $this->service->checkOut($request->user(), $request->validated());

        if (!$result['success']) {
            return response()->json(['message' => $result['message']], 422);
        }

        return response()->json([
            'message'       => 'Checked out successfully.',
            'working_hours' => $result['working_hours'],
            'log'           => new AttendanceLogResource($result['log']),
        ]);
    }

    public function index(Request $request)
    {
        $query = AttendanceLog::with(['employee', 'branch'])->orderBy('timestamp', 'desc');

        if ($request->employee_id) {
            $query->where('employee_id', $request->employee_id);
        }
        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }
        if ($request->date_from) {
            $query->whereDate('timestamp', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('timestamp', '<=', $request->date_to);
        }
        if ($request->flag) {
            $query->where('flag', $request->flag);
        }

        return AttendanceLogResource::collection($query->limit(200)->get());
    }

    public function mine(Request $request)
    {
        $logs = AttendanceLog::where('employee_id', $request->user()->id)
            ->orderBy('timestamp', 'desc')
            ->limit(100)
            ->get();

        return AttendanceLogResource::collection($logs);
    }

    public function anomalies()
    {
        $anomalies = collect();

        // Rejected GPS attempts
        $rejected = AttendanceLog::with('employee')
            ->where('is_valid', false)
            ->orderBy('timestamp', 'desc')
            ->limit(20)
            ->get()
            ->map(fn($l) => [
                'type'    => 'rejected_gps',
                'message' => ($l->employee->name ?? 'Unknown') . ' — GPS check-in rejected',
                'time'    => $l->timestamp?->toDateTimeString(),
            ]);

        // 3+ late check-ins
        $lateIds   = AttendanceLog::select('employee_id')
            ->where('type', 'check_in')
            ->where('flag', 'late')
            ->groupBy('employee_id')
            ->havingRaw('COUNT(*) >= 3')
            ->pluck('employee_id');

        $lateUsers = User::whereIn('id', $lateIds)->get()
            ->map(fn($u) => [
                'type'    => 'consecutive_late',
                'message' => $u->name . ' — 3+ late check-ins',
                'time'    => null,
            ]);

        // Missing check-outs today
        $checkedIn = AttendanceLog::with('employee')
            ->where('type', 'check_in')
            ->whereDate('timestamp', today())
            ->get();

        $missing = $checkedIn->filter(fn($log) =>
            !AttendanceLog::where('employee_id', $log->employee_id)
                ->where('type', 'check_out')
                ->whereDate('timestamp', today())
                ->exists()
        )->map(fn($l) => [
            'type'    => 'missing_checkout',
            'message' => ($l->employee->name ?? 'Unknown') . ' — missing check-out today',
            'time'    => $l->timestamp?->toDateTimeString(),
        ]);

        return response()->json(
            $anomalies->merge($rejected)->merge($lateUsers)->merge($missing)->values()
        );
    }
}
