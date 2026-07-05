<?php

namespace App\Http\Controllers;

use App\Http\Resources\ShiftRequestResource;
use App\Models\ShiftRequest;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ShiftRequestController extends Controller
{
    public function index(Request $request)
    {
        $query = ShiftRequest::with(['employee', 'schedule.branch', 'reviewer'])
            ->orderBy('id', 'desc');

        if ($request->status) {
            $query->where('status', $request->status);
        }

        return ShiftRequestResource::collection($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
            'reason'     => 'required|string|max:500',
        ]);

        $shiftRequest = ShiftRequest::create([
            'employee_id' => $request->user()->id,
            'start_date'  => $request->start_date,
            'end_date'    => $request->end_date,
            'reason'      => $request->reason,
            'status'      => 'pending',
        ]);

        return new ShiftRequestResource($shiftRequest->load('employee'));
    }

    public function mine(Request $request)
    {
        $requests = ShiftRequest::with(['schedule.branch'])
            ->where('employee_id', $request->user()->id)
            ->orderBy('id', 'desc')
            ->get();

        return ShiftRequestResource::collection($requests);
    }

    public function decide(Request $request, $id)
    {
        $request->validate([
            'status'        => 'required|in:approved,denied',
            'response_note' => 'nullable|string|max:500',
        ]);

        $shiftRequest = ShiftRequest::findOrFail($id);

        if ($shiftRequest->status !== 'pending') {
            return response()->json(['message' => 'This request has already been reviewed.'], 422);
        }

        $shiftRequest->update([
            'status'        => $request->status,
            'reviewed_by'   => $request->user()->id,
            'reviewed_at'   => Carbon::now(),
            'response_note' => $request->response_note,
        ]);

        return new ShiftRequestResource($shiftRequest->load(['employee', 'reviewer']));
    }
}
