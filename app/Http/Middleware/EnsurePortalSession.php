<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ganti middleware `auth` lama — tidak ada akun/password lagi, jadi tidak
 * ada guard Laravel untuk dicek. "Login" di app ini cuma berarti session PHP
 * menyimpan token Sanctum ERP hasil PIN (lihat PortalLoginController) — kalau
 * belum ada, arahkan ke halaman masuk PIN.
 */
class EnsurePortalSession
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->session()->get('portal.token')) {
            return redirect()->route('login');
        }

        return $next($request);
    }
}
