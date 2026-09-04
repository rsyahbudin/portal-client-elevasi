<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;

class KurvaSController extends Controller
{
    /**
     * Tab "Kurva S" sengaja disembunyikan sementara (belum final) — tab
     * navnya sudah dilepas dari ProjectNavTabs, ini jaga-jaga kalau ada
     * yang masih akses lewat link/bookmark lama. Balikin ke Laporan Harian.
     * Untuk aktifkan lagi nanti: kembalikan body method ini seperti semula
     * (render Inertia 'kurva-s/index' dari $erp->kurvaS()) dan tambahkan
     * lagi entry "Kurva S" ke BASE_TABS di project-nav-tabs.tsx.
     */
    public function index(int $project): RedirectResponse
    {
        return redirect()->route('projects.reports.index', $project);
    }
}
