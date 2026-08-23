import { useState } from 'react';

interface Props {
    mediaId: number;
    alt: string;
    /**
     * Dari `thumbnail_url` API. Portal TIDAK memakai URL itu langsung —
     * nilainya menunjuk ke ERP, sedangkan byte harus tetap lewat proxy
     * milik portal supaya token Bearer tidak pernah sampai ke browser.
     * Jadi field itu dipakai sebagai penanda "thumbnail tersedia" saja.
     */
    hasThumbnail: boolean;
}

const original = (id: number) => `/files/daily-report-media/${id}`;
const thumbnail = (id: number) => `/files/daily-report-media/${id}/thumbnail`;

/**
 * Gambar di grid galeri. Memuat versi thumbnail (~100 KB) alih-alih foto
 * asli dari kamera HP (bisa beberapa MB) — satu halaman dokumentasi memuat
 * 24 gambar sekaligus, jadi selisihnya menentukan halaman ini terasa ringan
 * atau macet.
 *
 * `onError` bukan pemanis: ERP membalas 404 kalau OneDrive tidak punya
 * turunan kecil untuk berkas itu (format tertentu tidak didukung), dan
 * tanpa fallback ini pengguna akan melihat kotak gambar rusak alih-alih
 * fotonya.
 */
export function GalleryImage({ mediaId, alt, hasThumbnail }: Props) {
    const [fallback, setFallback] = useState(!hasThumbnail);

    return (
        <img
            src={fallback ? original(mediaId) : thumbnail(mediaId)}
            alt={alt}
            loading="lazy"
            // Navigasi ke tab lain harus menang atas antrean gambar — tanpa
            // ini, klik pindah tab mengantre di belakang 24 permintaan foto.
            fetchPriority="low"
            decoding="async"
            onError={() => setFallback(true)}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
    );
}
