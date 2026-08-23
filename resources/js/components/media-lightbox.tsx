import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';

export interface LightboxItem {
    id: number;
    caption: string | null;
    fileName: string;
    isVideo: boolean;
}

interface Props {
    items: LightboxItem[];
    /** Indeks yang sedang dibuka; `null` berarti penampil tertutup. */
    index: number | null;
    onClose: () => void;
    onNavigate: (index: number) => void;
}

const fileUrl = (id: number) => `/files/daily-report-media/${id}`;
const downloadUrl = (id: number) =>
    `/files/daily-report-media/${id}?download=1`;

/**
 * Penampil foto/video layar penuh dengan navigasi antar berkas.
 *
 * Sebelumnya mengeklik gambar langsung mengunduhnya — perilaku itu datang
 * dari `Content-Disposition: attachment` di sisi ERP, yang kini disajikan
 * inline (lihat PortalFileServeController). Mengunduh tetap bisa, tapi jadi
 * tindakan sadar lewat tombol Unduh, bukan efek samping dari melihat.
 *
 * Dibangun di atas primitif Radix Dialog supaya jebakan fokus, tombol Esc,
 * dan penguncian scroll latar berperilaku benar — bukan overlay buatan
 * sendiri yang biasanya melewatkan hal-hal itu.
 */
export function MediaLightbox({ items, index, onClose, onNavigate }: Props) {
    const isOpen = index !== null;
    const current = isOpen ? items[index] : undefined;

    /*
     * Status muat disimpan sebagai ID berkas, bukan boolean yang direset
     * lewat effect saat berpindah gambar. Dengan begini keduanya TURUNAN dari
     * berkas yang sedang dibuka — pindah gambar otomatis kembali ke keadaan
     * "sedang memuat" tanpa effect penyelaras yang gampang keliru urutannya.
     */
    const [loadedId, setLoadedId] = useState<number | null>(null);
    const [failedId, setFailedId] = useState<number | null>(null);

    const loading = current ? loadedId !== current.id : false;
    const failed = current ? failedId === current.id : false;

    const hasMultiple = items.length > 1;
    const goPrev = useCallback(() => {
        if (index === null) {
            return;
        }

        onNavigate((index - 1 + items.length) % items.length);
    }, [index, items.length, onNavigate]);

    const goNext = useCallback(() => {
        if (index === null) {
            return;
        }

        onNavigate((index + 1) % items.length);
    }, [index, items.length, onNavigate]);

    useEffect(() => {
        if (!isOpen || !hasMultiple) {
            return;
        }

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                goPrev();
            }

            if (e.key === 'ArrowRight') {
                goNext();
            }
        };

        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, hasMultiple, goPrev, goNext]);

    /*
     * Muat berkas tetangga di latar supaya menekan panah terasa seketika.
     * Hanya untuk gambar — memuat video di depan justru memboroskan kuota
     * klien yang membuka portal dari HP di lapangan.
     */
    useEffect(() => {
        if (index === null || !hasMultiple) {
            return;
        }

        for (const offset of [1, -1]) {
            const neighbour =
                items[(index + offset + items.length) % items.length];

            if (neighbour && !neighbour.isVideo) {
                const img = new Image();

                img.src = fileUrl(neighbour.id);
            }
        }
    }, [index, items, hasMultiple]);

    // Geser jari untuk pindah berkas — portal ini mayoritas dibuka dari HP.
    const [touchStartX, setTouchStartX] = useState<number | null>(null);

    const handleTouchEnd = (endX: number) => {
        if (touchStartX === null || !hasMultiple) {
            return;
        }

        const delta = endX - touchStartX;

        if (Math.abs(delta) > 50) {
            if (delta > 0) {
                goPrev();
            } else {
                goNext();
            }
        }

        setTouchStartX(null);
    };

    return (
        <DialogPrimitive.Root
            open={isOpen}
            onOpenChange={(open) => !open && onClose()}
        >
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
                <DialogPrimitive.Content
                    className="fixed inset-0 z-50 flex flex-col focus:outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
                    aria-describedby={undefined}
                >
                    <DialogPrimitive.Title className="sr-only">
                        {current?.caption ||
                            current?.fileName ||
                            'Pratinjau berkas'}
                    </DialogPrimitive.Title>

                    <header className="flex shrink-0 items-center justify-between gap-3 p-3 text-white sm:p-4">
                        <span className="text-sm text-white/70 tabular-nums">
                            {isOpen ? `${index + 1} / ${items.length}` : ''}
                        </span>

                        <div className="flex items-center gap-1">
                            {current && (
                                <a
                                    href={downloadUrl(current.id)}
                                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
                                >
                                    <Download className="size-4 shrink-0" />
                                    <span className="hidden sm:inline">
                                        Unduh
                                    </span>
                                </a>
                            )}
                            <DialogPrimitive.Close
                                className="rounded-lg p-2 text-white transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
                                aria-label="Tutup"
                            >
                                <X className="size-5" />
                            </DialogPrimitive.Close>
                        </div>
                    </header>

                    <div
                        className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-14"
                        onTouchStart={(e) =>
                            setTouchStartX(e.touches[0]?.clientX ?? null)
                        }
                        onTouchEnd={(e) =>
                            handleTouchEnd(e.changedTouches[0]?.clientX ?? 0)
                        }
                    >
                        {loading && !failed && (
                            <span className="pointer-events-none absolute text-white/70">
                                <Spinner />
                            </span>
                        )}

                        {current && !failed && !current.isVideo && (
                            <img
                                key={current.id}
                                src={fileUrl(current.id)}
                                alt={current.caption || current.fileName}
                                onLoad={() => setLoadedId(current.id)}
                                onError={() => setFailedId(current.id)}
                                className="max-h-full max-w-full object-contain"
                            />
                        )}

                        {current && !failed && current.isVideo && (
                            <video
                                key={current.id}
                                src={fileUrl(current.id)}
                                controls
                                playsInline
                                onLoadedData={() => setLoadedId(current.id)}
                                onError={() => setFailedId(current.id)}
                                className="max-h-full max-w-full"
                            />
                        )}

                        {/*
                         * Proxy berkas belum mendukung permintaan sebagian (Range),
                         * dan sebagian browser — terutama Safari di iOS — menolak
                         * memutar video tanpa itu. Daripada menyisakan kotak hitam
                         * tanpa penjelasan, tawarkan unduhan sebagai jalan keluar.
                         */}
                        {failed && current && (
                            <div className="max-w-sm px-6 text-center text-white/80">
                                <p className="text-sm">
                                    Berkas ini tidak bisa ditampilkan di sini.
                                </p>
                                <a
                                    href={downloadUrl(current.id)}
                                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/25"
                                >
                                    <Download className="size-4" />
                                    Unduh berkas
                                </a>
                            </div>
                        )}

                        {hasMultiple && (
                            <>
                                <button
                                    type="button"
                                    onClick={goPrev}
                                    aria-label="Sebelumnya"
                                    className="absolute left-1 grid size-11 place-items-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none sm:left-2"
                                >
                                    <ChevronLeft className="size-6" />
                                </button>
                                <button
                                    type="button"
                                    onClick={goNext}
                                    aria-label="Berikutnya"
                                    className="absolute right-1 grid size-11 place-items-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none sm:right-2"
                                >
                                    <ChevronRight className="size-6" />
                                </button>
                            </>
                        )}
                    </div>

                    {current?.caption && (
                        <footer className="shrink-0 p-4 text-center">
                            <p className="mx-auto max-w-2xl text-sm text-white/80">
                                {current.caption}
                            </p>
                        </footer>
                    )}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
