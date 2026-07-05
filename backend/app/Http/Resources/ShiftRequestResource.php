<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShiftRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'employee_id'   => $this->employee_id,
            'employee_name' => $this->whenLoaded('employee', fn() => $this->employee->name),
            'schedule'      => $this->whenLoaded('schedule', fn() => [
                'id'          => $this->schedule->id,
                'day_of_week' => $this->schedule->day_of_week,
                'shift_start' => $this->schedule->shift_start,
                'shift_end'   => $this->schedule->shift_end,
                'branch_name' => $this->schedule->branch?->name,
            ]),
            'start_date'    => $this->start_date?->toDateString(),
            'end_date'      => $this->end_date?->toDateString(),
            'reason'        => $this->reason,
            'status'        => $this->status,
            'reviewed_by'   => $this->reviewed_by,
            'reviewer_name' => $this->whenLoaded('reviewer', fn() => $this->reviewer?->name),
            'reviewed_at'   => $this->reviewed_at?->toDateTimeString(),
            'response_note' => $this->response_note,
        ];
    }
}
