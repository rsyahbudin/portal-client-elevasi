<?php

use App\Http\Controllers\DailyReportController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentationController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\FileProxyController;
use App\Http\Controllers\KurvaSController;
use App\Http\Controllers\PortalLoginController;
use App\Http\Controllers\ProjectController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Route::get('login', [PortalLoginController::class, 'create'])->name('login');
Route::post('login', [PortalLoginController::class, 'store'])->middleware('throttle:10,1')->name('login.store');
Route::post('logout', [PortalLoginController::class, 'destroy'])->name('logout');

Route::middleware('portal.session')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('projects/{project}', [ProjectController::class, 'show'])->name('projects.show');
    Route::get('projects/{project}/reports', [DailyReportController::class, 'index'])->name('projects.reports.index');
    Route::get('projects/{project}/reports/{report}', [DailyReportController::class, 'show'])->name('projects.reports.show');
    Route::get('projects/{project}/kurva-s', [KurvaSController::class, 'index'])->name('projects.kurva-s');
    Route::get('projects/{project}/documentation', [DocumentationController::class, 'index'])->name('projects.documentation');
    Route::get('projects/{project}/belanja', [ExpenseController::class, 'index'])->name('projects.expenses');

    Route::get('files/pipeline-attachment/{attachment}', [FileProxyController::class, 'pipelineAttachment'])->name('files.pipeline-attachment');
    Route::get('files/daily-report-media/{media}', [FileProxyController::class, 'dailyReportMedia'])->name('files.daily-report-media');
    Route::get('files/daily-report-media/{media}/thumbnail', [FileProxyController::class, 'dailyReportMediaThumbnail'])->name('files.daily-report-media.thumbnail');
});

require __DIR__.'/settings.php';
