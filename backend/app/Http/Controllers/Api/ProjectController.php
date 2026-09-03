<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProjectController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Project::orderBy('name')->get()]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'pid_number' => ['nullable', 'string', 'max:100', 'unique:projects,pid_number'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Data tidak valid.', 'errors' => $validator->errors()], 422);
        }

        $project = Project::create($validator->validated());

        return response()->json(['message' => 'Project berhasil dibuat.', 'data' => $project], 201);
    }
}
