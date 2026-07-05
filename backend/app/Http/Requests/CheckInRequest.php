<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'gps_lat'          => 'required|numeric|between:-90,90',
            'gps_lng'          => 'required|numeric|between:-180,180',
            'readable_address' => 'nullable|string|max:255',
        ];
    }
}
