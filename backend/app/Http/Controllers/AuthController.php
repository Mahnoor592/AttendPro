<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    private function payload(User $user): array
    {
        return [
            'id'        => $user->id,
            'name'      => $user->name,
            'email'     => $user->email,
            'phone'     => $user->phone,
            'address'   => $user->address,
            'position'  => $user->position,
            'avatar'    => $user->avatar,
            'role'      => $user->role,
            'branch_id' => $user->branch_id,
            'branch'    => $user->branch?->name,
        ];
    }

    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|min:6',
        ]);

        $user = User::create([
            'name'      => $request->name,
            'email'     => $request->email,
            'password'  => $request->password,
            'role'      => 'admin',
            'is_active' => true,
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json(['user' => $this->payload($user), 'token' => $token], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Account is deactivated'], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json(['user' => $this->payload($user), 'token' => $token]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        return response()->json($this->payload($request->user()));
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name'    => 'required|string|max:100',
            'email'   => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'phone'   => 'nullable|string|max:30',
            'address' => 'nullable|string|max:255',
            'avatar'  => 'nullable|string',
        ]);

        $user->update($data);

        return response()->json($this->payload($user->fresh()));
    }

    public function destroyAccount(Request $request)
    {
        $user = $request->user();
        $user->tokens()->delete();   // revoke all Sanctum tokens
        $user->delete();             // cascades logs / schedules / requests via FKs

        return response()->json(['message' => 'Account deleted']);
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password'         => 'required|min:6',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->update(['password' => $request->password]);

        return response()->json(['message' => 'Password updated']);
    }
}
