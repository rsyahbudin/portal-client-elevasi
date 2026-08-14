<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Satu-satunya titik keluar HTTP ke ERP (baca data, bukan login — login PIN
 * lewat PortalLoginController). Semua controller HARUS lewat sini — jangan
 * panggil Http:: langsung — supaya caching, error handling, dan Bearer token
 * selalu konsisten & mudah diaudit.
 *
 * Token diambil dari session PHP (hasil login PIN), bukan dari DB — satu
 * token = satu scope (satu Project ATAU satu WorkSite/kawasan di sisi ERP),
 * jadi tidak perlu erp_client_id/erpClientId di mana pun lagi: cakupan data
 * yang boleh dilihat sudah ditentukan ERP dari token itu sendiri.
 */
class ErpApiClient
{
    private const CACHE_TTL_LIST = 60; // detik

    private const CACHE_TTL_DETAIL = 120;

    private readonly ?string $token;

    public function __construct(?string $token = null)
    {
        $this->token = $token ?? session('portal.token');
    }

    public function me(): ?array
    {
        return $this->get('/me');
    }

    public function projects(int $page = 1): ?array
    {
        return $this->cachedGet("projects_p{$page}", "/projects?page={$page}", self::CACHE_TTL_LIST);
    }

    public function project(int $projectId): ?array
    {
        return $this->cachedGet("project_{$projectId}", "/projects/{$projectId}", self::CACHE_TTL_DETAIL);
    }

    public function pipeline(int $projectId): ?array
    {
        return $this->cachedGet("pipeline_{$projectId}", "/projects/{$projectId}/pipeline", self::CACHE_TTL_DETAIL);
    }

    public function dailyReports(int $projectId, int $page = 1, ?string $month = null): ?array
    {
        $query = http_build_query(array_filter(['page' => $page, 'month' => $month]));

        return $this->cachedGet("reports_{$projectId}_p{$page}_{$month}", "/projects/{$projectId}/daily-reports?{$query}", self::CACHE_TTL_LIST);
    }

    public function dailyReport(int $projectId, int $reportId): ?array
    {
        return $this->cachedGet("report_{$projectId}_{$reportId}", "/projects/{$projectId}/daily-reports/{$reportId}", self::CACHE_TTL_DETAIL);
    }

    public function kurvaS(int $projectId): ?array
    {
        return $this->cachedGet("kurva_s_{$projectId}", "/projects/{$projectId}/kurva-s", self::CACHE_TTL_DETAIL);
    }

    public function documentation(int $projectId, int $page = 1, ?string $mediaType = null): ?array
    {
        $query = http_build_query(array_filter(['page' => $page, 'media_type' => $mediaType]));

        return $this->cachedGet("documentation_{$projectId}_p{$page}_{$mediaType}", "/projects/{$projectId}/documentation?{$query}", self::CACHE_TTL_LIST);
    }

    /**
     * Proxy stream byte file dari ERP — dipanggil dari FileProxyController,
     * bukan browser klien langsung, supaya token Bearer tidak pernah sampai
     * ke browser.
     */
    public function streamFile(string $path): Response
    {
        try {
            return $this->client()->get(rtrim(config('services.erp.base_url'), '/').$path);
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            report($e);
            abort(502, 'Tidak bisa menghubungi ERP.');
        }
    }

    private function cachedGet(string $cacheKeySuffix, string $path, int $ttl): ?array
    {
        if (! $this->token) {
            return null;
        }

        $key = 'erp_api:'.md5($this->token).":{$cacheKeySuffix}";

        return Cache::remember($key, $ttl, fn () => $this->get($path));
    }

    /**
     * Selalu kembalikan null kalau ERP tidak bisa dihubungi (timeout, DNS,
     * connection refused, dsb) — jangan pernah biarkan exception koneksi
     * menjalar sampai jadi 500 ke klien. Controller yang memanggil ini sudah
     * didesain menampilkan status "tidak bisa memuat data" saat null.
     */
    private function get(string $path): ?array
    {
        if (! $this->token) {
            return null;
        }

        try {
            $response = $this->client()->get(rtrim(config('services.erp.base_url'), '/').$path);
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            report($e);

            return null;
        }

        if (! $response->successful()) {
            return null;
        }

        return $response->json();
    }

    private function client(): PendingRequest
    {
        return Http::withToken((string) $this->token)
            ->acceptJson()
            ->timeout(10);
    }
}
