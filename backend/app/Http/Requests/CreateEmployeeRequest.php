<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'name'      => 'required|string|max:100',
            'email'     => 'required|email|unique:users,email,' . ($id ?? 'NULL'),
            'phone'     => 'nullable|string|max:30',
            'address'   => 'nullable|string|max:255',
            'position'  => 'nullable|string|max:100',
            'avatar'    => 'nullable|string',
            'password'  => $id ? 'nullable|string|min:6' : 'required|string|min:6',
            'role'      => 'required|in:hr,employee',
            'branch_id' => 'nullable|exists:branches,id',
            'is_active' => 'sometimes|boolean',
        ];
    }
}
