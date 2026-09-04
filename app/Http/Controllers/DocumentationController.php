<?php

namespace App\Http\Controllers;

use App\Services\ErpApiClient;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DocumentationController extends Controller
{
    public function index(Request $request, int $project): Response
    {
        $erp = new ErpApiClient;

        $projectData = $erp->project($project);
        abort_if($projectData === null, 404);

        $mediaType = $request->query('media_type');
        $documentation = $erp->documentation($project, $mediaType);

        return Inertia::render('documentation/index', [
            'project' => $projectData,
            'documentation' => $documentation,
            'selectedMediaType' => $mediaType,
        ]);
    }
}
