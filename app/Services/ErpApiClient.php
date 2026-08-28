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

    /** Byte thumbnail tidak pernah berubah — TTL panjang aman. */
    private const CACHE_TTL_THUMBNAIL = 21600; // 6 jam

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
     * 404 dari ERP kalau staf belum menyalakan opt-in laporan belanja untuk
     * proyek ini — `get()` sudah balikin null untuk semua response gagal,
     * jadi dari sisi sini "opt-in mati" dan "ERP tidak bisa dihubungi" sama
     * saja: null. Controller yang menampilkan tab "Belanja" HARUS sudah
     * mengecek `project.can_view_expenses` dulu sebelum manggil ini, jadi
     * null di sini seharusnya cuma berarti masalah koneksi, bukan opt-in.
     */
    public function expenses(int $projectId, int $page = 1, ?string $dateFrom = null, ?string $dateTo = null): ?array
    {
        $query = http_build_query(array_filter(['page' => $page, 'date_from' => $dateFrom, 'date_to' => $dateTo]));

        return $this->cachedGet(
            "expenses_{$projectId}_p{$page}_{$dateFrom}_{$dateTo}",
            "/projects/{$projectId}/expenses?{$query}",
            self::CACHE_TTL_LIST,
        );
    }

    /**
     * Proxy stream byte file dari ERP — dipanggil dari FileProxyController,
     * bukan browser klien langsung, supaya token Bearer tidak pernah sampai
     * ke browser.
     *
     * `stream => true` PENTING: tanpa itu Guzzle menarik seluruh isi file ke
     * memori PHP dulu sebelum sebaris pun sampai ke browser. Foto lapangan
     * dari HP bisa beberapa MB dan satu halaman dokumentasi memuat 24 di
     * antaranya — membuffer semuanya bikin TTFB tiap gambar setara waktu
     * unduh penuhnya dari OneDrive.
     *
     * Timeout dinaikkan dari default 10 detik: batas itu masuk akal untuk
     * panggilan JSON, tapi file besar lewat OneDrive wajar lebih lama.
     */
    public function streamFile(string $path): Response
    {
        try {
            return $this->client()
                ->timeout(30)
                ->withOptions(['stream' => true])
                ->get(rtrim(config('services.erp.base_url'), '/').$path);
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            report($e);
            abort(502, 'Tidak bisa menghubungi ERP.');
        }
    }

    /**
     * Ambil byte thumbnail, dengan cache DI SISI PORTAL — bukan hanya di ERP.
     *
     * Alasannya bukan sekadar hemat jaringan, tapi worker PHP-FPM. Setiap
     * permintaan gambar yang diteruskan ke ERP memakai DUA worker sekaligus:
     * satu ditahan portal selama menunggu jawaban, satu lagi dipakai ERP
     * untuk menjawab. Pada pool yang kecil, belasan gambar di satu halaman
     * galeri sanggup menghabiskan seluruh worker sampai permintaan navigasi
     * pengguna ikut mengantre di belakangnya — bahkan bisa saling mengunci,
     * karena worker portal menunggu ERP yang tidak kebagian worker.
     *
     * Dengan cache di sini, permintaan berikutnya cukup satu worker dan tidak
     * menyentuh ERP sama sekali.
     *
     * Kunci cache WAJIB memuat token, sama seperti cachedGet(). Tanpa itu,
     * PIN lain bisa menerima byte foto langsung dari cache tanpa pernah
     * melewati pemeriksaan kepemilikan proyek di ERP.
     *
     * @return array{body: string, mime: string}|null
     */
    public function thumbnail(string $path): ?array
    {
        if (! $this->token) {
            return null;
        }

        $key = 'erp_thumb:'.md5($this->token).':'.md5($path);
        $cached = $this->cacheGet($key);

        if ($cached !== null) {
            // Ketidaktersediaan ikut disimpan supaya berkas tanpa thumbnail
            // tidak memicu perjalanan ke ERP berulang kali.
            return $cached === false ? null : $cached;
        }

        $result = $this->fetchThumbnail($path);

        $this->cachePut($key, $result ?? false);

        return $result;
    }

    /**
     * @return array{body: string, mime: string}|null
     */
    private function fetchThumbnail(string $path): ?array
    {
        try {
            $response = $this->client()
                ->timeout(20)
                ->get(rtrim(config('services.erp.base_url'), '/').$path);
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            report($e);

            return null;
        }

        if (! $response->successful()) {
            return null;
        }

        return [
            'body' => $response->body(),
            'mime' => $response->header('Content-Type') ?: 'image/jpeg',
        ];
    }

    /**
     * Byte biner ditaruh di Redis, bukan cache bawaan (`database`) — menaruh
     * blob ratusan KB di tabel cache PostgreSQL justru memindahkan beban ke
     * database. Redis mati bukan alasan untuk menggagalkan permintaan:
     * cache-nya opsional, jalur ke ERP tetap jalan.
     */
    private function cacheGet(string $key): mixed
    {
        try {
            return Cache::store('redis')->get($key);
        } catch (\Throwable) {
            return null;
        }
    }

    private function cachePut(string $key, mixed $value): void
    {
        try {
            Cache::store('redis')->put($key, $value, self::CACHE_TTL_THUMBNAIL);
        } catch (\Throwable) {
            // Cache hanya percepatan — kegagalannya tidak boleh terlihat klien.
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
