<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateEmployeeRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('branch')->where('role', '!=', 'admin');

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }
        if ($request->role) {
            $query->where('role', $request->role);
        }
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        return UserResource::collection($query->get());
    }

    public function show($id)
    {
        return new UserResource(User::with('branch')->findOrFail($id));
    }

    public function store(CreateEmployeeRequest $request)
    {
        $user = User::create($request->validated());

        return new UserResource($user->load('branch'));
    }

    public function update(CreateEmployeeRequest $request, $id)
    {
        $user = User::findOrFail($id);
        $data = $request->validated();

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        return new UserResource($user->load('branch'));
    }

    public function destroy($id)
    {
        User::findOrFail($id)->delete();

        return response()->json(['message' => 'Employee deleted']);
    }
}
