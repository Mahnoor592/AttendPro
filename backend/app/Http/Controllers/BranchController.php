<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateBranchRequest;
use App\Http\Resources\BranchResource;
use App\Models\Branch;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function index()
    {
        return BranchResource::collection(Branch::with('manager')->get());
    }

    public function store(CreateBranchRequest $request)
    {
        $branch = Branch::create([
            'name'          => $request->name,
            'address'       => $request->address,
            'image'         => $request->image,
            'email'         => $request->email,
            'phone'         => $request->phone,
            'lat'           => $request->lat,
            'lng'           => $request->lng,
            'radius_meters' => $request->radius,
            'shift_start'   => $request->shift_start,
            'shift_end'     => $request->shift_end,
            'working_days'  => $request->working_days,
            'manager_id'    => $request->manager_id,
        ]);

        if ($request->filled('created_at')) {
            $branch->created_at = $request->created_at;
            $branch->save();
        }

        return new BranchResource($branch->load('manager'));
    }

    public function show($id)
    {
        return new BranchResource(Branch::with('manager')->findOrFail($id));
    }

    public function update(CreateBranchRequest $request, $id)
    {
        $branch = Branch::findOrFail($id);
        $branch->update([
            'name'          => $request->name,
            'address'       => $request->address,
            'email'         => $request->email,
            'phone'         => $request->phone,
            'lat'           => $request->lat,
            'lng'           => $request->lng,
            'radius_meters' => $request->radius,
            'shift_start'   => $request->shift_start,
            'shift_end'     => $request->shift_end,
            'working_days'  => $request->working_days,
            'manager_id'    => $request->manager_id,
        ]);

        if ($request->filled('created_at')) {
            $branch->created_at = $request->created_at;
            $branch->save();
        }

        return new BranchResource($branch->load('manager'));
    }

    public function updateImage(Request $request, $id)
    {
        $request->validate(['image' => 'nullable|string']);

        $branch = Branch::findOrFail($id);
        $branch->update(['image' => $request->image]);

        return new BranchResource($branch->load('manager'));
    }

    public function destroy($id)
    {
        Branch::findOrFail($id)->delete();

        return response()->json(['message' => 'Branch deleted']);
    }
}
