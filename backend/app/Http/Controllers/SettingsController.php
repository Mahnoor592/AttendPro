<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        return response()->json(Setting::all()->pluck('value', 'key'));
    }

    public function update(Request $request)
    {
        $request->validate([
            'company_name'        => 'sometimes|string|max:100',
            'company_email'       => 'sometimes|nullable|email|max:255',
            'company_phone'       => 'sometimes|nullable|string|max:30',
            'company_address'     => 'sometimes|nullable|string|max:255',
            'company_logo'        => 'sometimes|nullable|string',
            'geofence_buffer'     => 'sometimes|integer|min:0|max:1000',
            'email_notifications' => 'sometimes|in:true,false',
        ]);

        $allowed = ['company_name', 'company_email', 'company_phone', 'company_address', 'company_logo', 'geofence_buffer', 'email_notifications'];

        foreach ($request->only($allowed) as $key => $value) {
            Setting::set($key, $value);
        }

        return response()->json(Setting::all()->pluck('value', 'key'));
    }
}
