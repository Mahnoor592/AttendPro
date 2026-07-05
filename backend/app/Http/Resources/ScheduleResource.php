<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ScheduleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'employee_id'     => $this->employee_id,
            'employee_name'   => $this->whenLoaded('employee', fn() => $this->employee->name),
            'branch_id'       => $this->branch_id,
            'branch_name'     => $this->whenLoaded('branch', fn() => $this->branch->name),
            'day_of_week'     => $this->day_of_week,
            'shift_start'     => $this->shift_start,
            'shift_end'       => $this->shift_end,
            'week_start_date' => $this->week_start_date,
        ];
    }
}
