<?php

namespace App\Http\Controllers;

use App\Services\ErpApiClient;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function index(Request $request, int $project): Response
    {
        $erp = new ErpApiClient;

        $projectData = $erp->project($project);
        abort_if($projectData === null, 404);

        // Opt-in per proyek — staf ERP yang menentukan, bukan portal. Kalau
        // mati, tab "Belanja" seharusnya sudah disembunyikan di nav (lihat
        // ProjectNavTabs), tapi orang bisa saja ketik URL-nya langsung.
        abort_unless($projectData['can_view_expenses'] ?? false, 404);

        $dateFrom = $request->query('date_from');
        $dateTo = $request->query('date_to');

        $expenses = $erp->expenses($project, (int) $request->query('page', 1), $dateFrom, $dateTo);

        return Inertia::render('expenses/index', [
            'project' => $projectData,
            'expenses' => $expenses,
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }
}
