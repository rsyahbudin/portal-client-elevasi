<?php

namespace App\Http\Controllers;

use App\Services\ErpApiClient;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Proxy stream byte file dari ERP. Browser klien HANYA pernah lihat URL
 * /files/... milik app ini — token Bearer ke ERP tidak pernah dikirim ke
 * browser sama sekali (dipakai server-side di sini saja, dari session).
 * Cakupan (scope) sudah ditentukan token itu sendiri di sisi ERP.
 */
class FileProxyController extends Controller
{
    public function pipelineAttachment(int $attachment): StreamedResponse
    {
        return $this->stream("/files/pipeline-attachment/{$attachment}");
    }

    public function dailyReportMedia(int $media): StreamedResponse
    {
        return $this->stream("/files/daily-report-media/{$media}");
    }

    private function stream(string $path): StreamedResponse
    {
        $erp = new ErpApiClient;
        $response = $erp->streamFile($path);

        abort_unless($response->successful(), $response->status());

        return new StreamedResponse(function () use ($response) {
            echo $response->body();
        }, 200, [
            'Content-Type' => $response->header('Content-Type') ?: 'application/octet-stream',
            'Content-Disposition' => $response->header('Content-Disposition') ?: 'inline',
        ]);
    }
}
