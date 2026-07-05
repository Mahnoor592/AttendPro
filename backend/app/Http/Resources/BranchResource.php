<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BranchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'name'         => $this->name,
            'address'      => $this->address,
            'image'        => $this->image,
            'email'        => $this->email,
            'phone'        => $this->phone,
            'lat'          => (float) $this->lat,
            'lng'          => (float) $this->lng,
            'radius'       => (int) $this->radius_meters,
            'shift_start'  => $this->shift_start,
            'shift_end'    => $this->shift_end,
            'working_days' => $this->working_days,
            'manager_id'   => $this->manager_id,
            'manager'      => $this->manager?->name,
            'created_at'   => $this->created_at,
        ];
    }
}
