<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PersonalToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * FR-01: login menggunakan akun perusahaan, dashboard ditentukan berdasarkan role.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Data tidak valid.', 'errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Email atau password salah.'], 401);
        }

        $plainToken = Str::random(64);

        PersonalToken::create([
            'user_id' => $user->id,
            'token' => hash('sha256', $plainToken),
            'expires_at' => now()->addDays(7),
        ]);

        return response()->json([
            'message' => 'Login berhasil.',
            'token' => $plainToken,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'department' => $user->department,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $plainToken = $request->bearerToken();

        if ($plainToken) {
            PersonalToken::where('token', hash('sha256', $plainToken))->delete();
        }

        return response()->json(['message' => 'Logout berhasil.']);
    }

    public function me(Request $request)
    {
        return response()->json(['user' => $request->user()]);
    }
}
