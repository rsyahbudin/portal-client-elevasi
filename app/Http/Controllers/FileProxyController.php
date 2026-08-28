<?php

namespace App\Http\Controllers;

use App\Services\ErpApiClient;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Proxy stream byte file dari ERP. Browser klien HANYA pernah lihat URL
 * /files/... milik app ini — token Bearer ke ERP tidak pernah dikirim ke
 * browser sama sekali (dipakai server-side di sini saja, dari session).
 * Cakupan (scope) sudah ditentukan token itu sendiri di sisi ERP.
 *
 * CATATAN KINERJA — kenapa header cache di bawah penting:
 * satu permintaan gambar di sini berantai jauh sebelum byte pertama keluar:
 *
 *   browser -> portal (boot Laravel + sesi DB)
 *           -> HTTP ke ERP (boot Laravel + Sanctum)
 *           -> unduh dari OneDrive lewat internet
 *
 * Satu halaman dokumentasi memuat 24 gambar, jadi 24 rantai seperti itu.
 * Tanpa header cache, rantai itu diulang SETIAP kali halaman dibuka, dan
 * karena browser cuma membuka ~6 koneksi bersamaan per host, permintaan
 * navigasi Inertia ke halaman lain ikut mengantre di belakangnya — itulah
 * kenapa pindah dari tab Dokumentasi terasa macet.
 */
class FileProxyController extends Controller
{
    /**
     * Satu jam. Sengaja tidak lebih lama meski byte-nya praktis tidak pernah
     * berubah: PIN di portal ini memang dibagikan berganti-ganti orang dan
     * satu perangkat bisa dipakai pengawas berbeda, jadi umur cache dibuat
     * sebatas satu sesi pemantauan yang wajar.
     */
    private const BROWSER_CACHE_SECONDS = 3600;

    public function pipelineAttachment(int $attachment): StreamedResponse
    {
        return $this->stream("/files/pipeline-attachment/{$attachment}");
    }

    /**
     * `?download=1` diteruskan ke ERP, yang membalas dengan
     * `Content-Disposition: attachment`. Tanpa parameter itu berkas disajikan
     * inline supaya bisa ditampilkan di penampil galeri, bukan diunduh.
     */
    public function dailyReportMedia(Request $request, int $media): StreamedResponse
    {
        $query = $request->boolean('download') ? '?download=1' : '';

        return $this->stream("/files/daily-report-media/{$media}{$query}");
    }

    /**
     * Versi kecil untuk grid galeri — inilah yang membuat halaman Dokumentasi
     * ringan: ERP mengambilnya dari thumbnail bawaan OneDrive (~100 KB),
     * bukan foto asli dari kamera HP yang bisa beberapa MB.
     *
     * Berbeda dengan file asli di atas, thumbnail TIDAK dialirkan langsung
     * dari ERP melainkan lewat cache portal (lihat ErpApiClient::thumbnail) —
     * satu halaman galeri memuat belasan gambar sekaligus, dan meneruskan
     * semuanya ke ERP menghabiskan worker PHP-FPM sampai navigasi pengguna
     * ikut tertahan.
     *
     * Balas 404 kalau thumbnail tidak ada; klien sudah menyiapkan fallback
     * ke file asli.
     */
    /**
     * Bukti belanjaan (foto struk/nota) — tidak ditautkan ke baris belanja
     * tertentu, cuma dikumpulkan per proyek. Sama seperti dailyReportMedia:
     * `?download=1` untuk unduh, sebaliknya disajikan inline untuk galeri.
     */
    public function expenseProof(Request $request, int $proof): StreamedResponse
    {
        $query = $request->boolean('download') ? '?download=1' : '';

        return $this->stream("/files/expense-proof/{$proof}{$query}");
    }

    public function dailyReportMediaThumbnail(int $media): Response
    {
        $thumbnail = (new ErpApiClient)->thumbnail("/files/daily-report-media/{$media}/thumbnail");

        abort_if($thumbnail === null, 404);

        return response($thumbnail['body'], 200, [
            'Content-Type' => $thumbnail['mime'],
            'Content-Disposition' => 'inline',
            'Cache-Control' => 'private, max-age='.self::BROWSER_CACHE_SECONDS,
        ]);
    }

    private function stream(string $path): StreamedResponse
    {
        $erp = new ErpApiClient;
        $response = $erp->streamFile($path);

        abort_unless($response->successful(), $response->status());

        $body = $response->toPsrResponse()->getBody();

        $headers = [
            'Content-Type' => $response->header('Content-Type') ?: 'application/octet-stream',
            'Content-Disposition' => $response->header('Content-Disposition') ?: 'inline',
            // `private` (bukan `public`): file ini digerbangi sesi, tidak boleh
            // menempel di cache bersama seperti CDN atau proxy perusahaan.
            'Cache-Control' => 'private, max-age='.self::BROWSER_CACHE_SECONDS,
        ];

        // Diteruskan kalau ERP mengirimnya, supaya browser bisa menampilkan
        // progres unduh alih-alih spinner tanpa ujung.
        if ($length = $response->header('Content-Length')) {
            $headers['Content-Length'] = $length;
        }

        return new StreamedResponse(function () use ($body) {
            while (! $body->eof()) {
                echo $body->read(8192);
                flush();
            }

            $body->close();
        }, 200, $headers);
    }
}
