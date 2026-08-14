<?php

namespace App\Http\Controllers;

use App\Services\ErpApiClient;
use Inertia\Inertia;
use Inertia\Response;

class KurvaSController extends Controller
{
    public function index(int $project): Response
    {
        $erp = new ErpApiClient;

        $projectData = $erp->project($project);
        abort_if($projectData === null, 404);

        $kurvaS = $erp->kurvaS($project);

        return Inertia::render('kurva-s/index', [
            'project' => $projectData,
            'kurvaS' => $kurvaS,
        ]);
    }
}
