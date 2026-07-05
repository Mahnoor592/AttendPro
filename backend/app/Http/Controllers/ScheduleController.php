<?php

namespace App\Http\Controllers;

use App\Http\Resources\ScheduleResource;
use App\Mail\ShiftAssigned;
use App\Mail\ShiftUpdated;
use App\Models\Schedule;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        $query = Schedule::with(['employee', 'branch']);

        if ($request->week_start_date) {
            $query->where('week_start_date', $request->week_start_date);
        }
        if ($request->employee_id) {
            $query->where('employee_id', $request->employee_id);
        }
        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        return ScheduleResource::collection($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'employee_id'     => 'required|exists:users,id',
            'branch_id'       => 'required|exists:branches,id',
            'day_of_week'     => 'required|in:Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
            'shift_start'     => 'required|date_format:H:i',
            'shift_end'       => 'required|date_format:H:i',
            'week_start_date' => 'required|date',
        ]);

        $schedule = Schedule::updateOrCreate(
            [
                'employee_id'     => $request->employee_id,
                'day_of_week'     => $request->day_of_week,
                'week_start_date' => $request->week_start_date,
            ],
            [
                'branch_id'   => $request->branch_id,
                'shift_start' => $request->shift_start,
                'shift_end'   => $request->shift_end,
            ]
        );

        $schedule->load(['employee', 'branch']);

        if (Setting::get('email_notifications', 'true') === 'true') {
            $email = $schedule->employee->email;
            if ($schedule->wasRecentlyCreated) {
                Mail::to($email)->send(new ShiftAssigned($schedule));
            } else {
                Mail::to($email)->send(new ShiftUpdated($schedule));
            }
        }

        return new ScheduleResource($schedule);
    }

    public function show(Schedule $schedule)
    {
        return new ScheduleResource($schedule->load(['employee', 'branch']));
    }

    public function update(Request $request, Schedule $schedule)
    {
        $request->validate([
            'branch_id'   => 'sometimes|exists:branches,id',
            'shift_start' => 'sometimes|date_format:H:i',
            'shift_end'   => 'sometimes|date_format:H:i',
        ]);

        $schedule->update($request->only(['branch_id', 'shift_start', 'shift_end']));
        $schedule->load(['employee', 'branch']);

        if (Setting::get('email_notifications', 'true') === 'true') {
            Mail::to($schedule->employee->email)->send(new ShiftUpdated($schedule));
        }

        return new ScheduleResource($schedule);
    }

    public function destroy(Schedule $schedule)
    {
        $schedule->delete();

        return response()->json(['message' => 'Schedule deleted']);
    }

    public function mine(Request $request)
    {
        $schedules = Schedule::with('branch')
            ->where('employee_id', $request->user()->id)
            ->orderBy('week_start_date', 'desc')
            ->get();

        return ScheduleResource::collection($schedules);
    }
}
