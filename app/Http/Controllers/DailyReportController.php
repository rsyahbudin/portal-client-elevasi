<?php

namespace App\Http\Controllers;

use App\Services\ErpApiClient;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DailyReportController extends Controller
{
    public function index(Request $request, int $project): Response
    {
        $erp = new ErpApiClient;

        $projectData = $erp->project($project);
        abort_if($projectData === null, 404);

        $reports = $erp->dailyReports(
            $project,
            (int) $request->query('page', 1),
            $request->query('month'),
        );

        return Inertia::render('reports/index', [
            'project' => $projectData,
            'reports' => $reports,
            'selectedMonth' => $request->query('month'),
        ]);
    }

    public function show(int $project, int $report): Response
    {
        $erp = new ErpApiClient;

        $projectData = $erp->project($project);
        abort_if($projectData === null, 404);

        $reportData = $erp->dailyReport($project, $report);
        abort_if($reportData === null, 404);

        return Inertia::render('reports/show', [
            'project' => $projectData,
            'report' => $reportData,
        ]);
    }
}
