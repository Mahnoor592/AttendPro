<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateBranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'         => 'required|string|max:255',
            'address'      => 'required|string',
            'image'        => 'nullable|string',
            'email'        => 'nullable|email|max:255',
            'phone'        => 'nullable|string|max:30',
            'lat'          => 'required|numeric|between:-90,90',
            'lng'          => 'required|numeric|between:-180,180',
            'radius'       => 'required|integer|min:50|max:5000',
            'shift_start'  => 'required|date_format:H:i',
            'shift_end'    => 'required|date_format:H:i',
            'working_days' => 'nullable|string|max:255',
            'manager_id'   => 'nullable|exists:users,id',
            'created_at'   => 'nullable|date',
        ];
    }
}
