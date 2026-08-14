<?php

namespace App\Http\Controllers;

use App\Services\ErpApiClient;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $erp = new ErpApiClient;
        $result = $erp->projects();

        return Inertia::render('dashboard', [
            'projects' => $result['data'] ?? [],
            'scopeLabel' => $request->session()->get('portal.label'),
            'erpUnreachable' => $result === null,
        ]);
    }
}
