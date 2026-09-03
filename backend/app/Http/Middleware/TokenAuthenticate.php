<?php

namespace App\Http\Middleware;

use App\Models\PersonalToken;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class TokenAuthenticate
{
    public function handle(Request $request, Closure $next): Response
    {
        $plainToken = $request->bearerToken();

        if (! $plainToken) {
            return response()->json(['message' => 'Token tidak ditemukan.'], 401);
        }

        $hashed = hash('sha256', $plainToken);

        $token = PersonalToken::with('user')
            ->where('token', $hashed)
            ->first();

        if (! $token || ! $token->user) {
            return response()->json(['message' => 'Token tidak valid.'], 401);
        }

        if ($token->expires_at && $token->expires_at->isPast()) {
            $token->delete();

            return response()->json(['message' => 'Token sudah kedaluwarsa, silakan login kembali.'], 401);
        }

        $token->forceFill(['last_used_at' => now()])->save();

        Auth::setUser($token->user);

        return $next($request);
    }
}
