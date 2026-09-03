<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Contoh pemakaian di route: ->middleware('role:karyawan,finance')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $userRole = $user->role instanceof \BackedEnum ? $user->role->value : $user->role;

        if (! in_array($userRole, $roles, true)) {
            return response()->json(['message' => 'Anda tidak memiliki akses untuk aksi ini.'], 403);
        }

        return $next($request);
    }
}
