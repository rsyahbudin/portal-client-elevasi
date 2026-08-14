<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;

class ProjectController extends Controller
{
    /**
     * Untuk sekarang, halaman utama proyek = Laporan Harian (permintaan
     * owner: prioritaskan laporan harian dulu, timeline/317office
     * disembunyikan sementara — lihat DailyReportController::index()).
     * Redirect ini jaga-jaga kalau ada link/bookmark lama ke halaman ini.
     */
    public function show(int $project): RedirectResponse
    {
        return redirect()->route('projects.reports.index', ['project' => $project]);
    }
}
