<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'employee_id'      => $this->employee_id,
            'employee_name'    => $this->whenLoaded('employee', fn() => $this->employee->name),
            'branch_id'        => $this->branch_id,
            'branch_name'      => $this->whenLoaded('branch', fn() => $this->branch->name),
            'type'             => $this->type,
            'gps_lat'          => $this->gps_lat,
            'gps_lng'          => $this->gps_lng,
            'readable_address' => $this->readable_address,
            'timestamp'        => $this->timestamp?->toDateTimeString(),
            'is_valid'         => $this->is_valid,
            'flag'             => $this->flag,
            'working_hours'    => $this->working_hours,
        ];
    }
}
