<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Login" di app ini = tukar PIN 6 digit (per proyek/kawasan) + nama dengan
 * token Sanctum dari ERP. Tidak ada akun sama sekali — token & label scope
 * cuma hidup di session PHP (lihat EnsurePortalSession), tidak pernah
 * disimpan permanen di DB. Nama diminta tiap kali masuk supaya ERP bisa
 * mencatat siapa (bebas ketik nama) & kapan lewat audit log — bukan untuk
 * identifikasi/otentikasi, PIN-nya yang jadi kunci akses.
 */
class PortalLoginController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('auth/login');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'pin' => 'required|string|size:6',
            'name' => 'required|string|max:255',
        ]);

        try {
            $response = Http::acceptJson()->timeout(10)->post(
                rtrim(config('services.erp.base_url'), '/').'/portal/login',
                $validated,
            );
        } catch (ConnectionException $e) {
            report($e);

            throw ValidationException::withMessages([
                'pin' => 'Tidak bisa menghubungi server — coba lagi sebentar.',
            ]);
        }

        if (! $response->successful()) {
            throw ValidationException::withMessages([
                'pin' => $response->json('errors.pin.0') ?? 'PIN tidak ditemukan atau sudah tidak berlaku.',
            ]);
        }

        $data = $response->json();

        $request->session()->regenerate();
        $request->session()->put('portal.token', $data['token']);
        $request->session()->put('portal.scope', $data['scope']);
        $request->session()->put('portal.label', $data['label']);
        $request->session()->put('portal.viewer_name', $validated['name']);

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Cuma bersihkan session BROWSER INI — sengaja TIDAK memanggil ERP untuk
     * mencabut token, karena satu PIN bisa dipakai banyak orang sekaligus
     * (itu memang tujuannya); mencabut token di sini akan ikut nge-logout
     * semua orang lain yang masih pakai PIN yang sama.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->session()->forget(['portal.token', 'portal.scope', 'portal.label', 'portal.viewer_name']);
        $request->session()->regenerate();

        return redirect()->route('login');
    }
}
