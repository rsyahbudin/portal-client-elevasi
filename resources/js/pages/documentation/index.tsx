import { Head, router } from '@inertiajs/react';
import { Images, PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { GalleryImage } from '@/components/gallery-image';
import type { LightboxItem } from '@/components/media-lightbox';
import { MediaLightbox } from '@/components/media-lightbox';
import { Paginator } from '@/components/paginator';
import { ProjectNavTabs } from '@/components/project-nav-tabs';
import { ProjectPageHeader } from '@/components/project-page-header';
import { cn } from '@/lib/utils';

interface MediaItem {
    id: number;
    file_name: string;
    media_type: string;
    caption: string | null;
    report_date: string | null;
    work_item_label: string;
    url: string;
    /** null untuk video, atau bila OneDrive tidak punya turunan kecilnya. */
    thumbnail_url: string | null;
}

interface Props {
    project: {
        id: number;
        name: string;
        job_number: string | null;
        location: string | null;
        can_view_expenses?: boolean;
    };
    documentation: {
        data: MediaItem[];
        current_page?: number;
        last_page?: number;
        stats?: { total: number; photos: number; videos: number };
    } | null;
    selectedMediaType: string | null;
}

const FILTERS = [
    { value: null, label: 'Semua' },
    { value: 'photo', label: 'Foto' },
    { value: 'video', label: 'Video' },
] as const;

const NO_DATE_KEY = '__no_date__';

/** Kelompokkan per tanggal laporan — urutan kelompok mengikuti urutan kemunculan item (server sudah urut terbaru dulu). */
function groupByDate(items: MediaItem[]): Map<string, MediaItem[]> {
    const groups = new Map<string, MediaItem[]>();

    for (const item of items) {
        const key = item.report_date ?? NO_DATE_KEY;
        const existing = groups.get(key);

        if (existing) {
            existing.push(item);
        } else {
            groups.set(key, [item]);
        }
    }

    return groups;
}

function formatDateHeader(dateKey: string): string {
    if (dateKey === NO_DATE_KEY) return 'Tanpa tanggal';
    const date = new Date(`${dateKey}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateKey;
    return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

export default function DocumentationIndex({
    project,
    documentation,
    selectedMediaType,
}: Props) {
    const items = documentation?.data ?? [];
    const currentPage = documentation?.current_page ?? 1;
    const lastPage = documentation?.last_page ?? 1;
    const stats = documentation?.stats;
    const groups = groupByDate(items);

    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    /*
     * Penampil menavigasi seluruh berkas di halaman ini secara berurutan,
     * menembus batas kelompok tanggal — menekan "berikutnya" di foto
     * terakhir sebuah tanggal wajar dilanjutkan ke tanggal setelahnya,
     * bukan berhenti. Maka indeksnya mengacu ke daftar rata `items`,
     * sementara `groups` hanya mengatur tampilan gridnya.
     */
    const lightboxItems: LightboxItem[] = items.map((m) => ({
        id: m.id,
        caption: m.caption,
        fileName: m.file_name,
        isVideo: m.media_type !== 'photo',
    }));
    const indexById = new Map(items.map((m, i) => [m.id, i]));

    const baseUrl = `/projects/${project.id}/documentation`;

    function goTo(page: number, mediaType: string | null | undefined) {
        router.get(
            baseUrl,
            {
                ...(mediaType ? { media_type: mediaType } : {}),
                ...(page > 1 ? { page } : {}),
            },
            { preserveScroll: true },
        );
    }

    return (
        <>
            <Head title={`Dokumentasi — ${project.name}`} />
            <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <ProjectPageHeader project={project} />

                <ProjectNavTabs projectId={project.id} active="documentation" showExpenses={project.can_view_expenses} />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                        Dokumentasi{stats ? ` — ${stats.total} berkas` : ''}
                    </h2>

                    <div className="flex w-full gap-1 rounded-xl border border-border bg-card p-1 shadow-xs sm:w-fit">
                        {FILTERS.map((opt) => {
                            const isActive =
                                (selectedMediaType ?? null) === opt.value;

                            return (
                                <button
                                    key={opt.label}
                                    type="button"
                                    aria-pressed={isActive}
                                    onClick={() => goTo(1, opt.value)}
                                    className={cn(
                                        'flex-1 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:flex-none sm:px-4',
                                        isActive
                                            ? 'bg-primary text-primary-foreground shadow-xs'
                                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                                    )}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
                        <Images className="size-10 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                            Belum ada dokumentasi untuk proyek ini.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-8">
                            {Array.from(groups.entries()).map(
                                ([dateKey, media]) => (
                                    <section
                                        key={dateKey}
                                        className="flex flex-col gap-3"
                                    >
                                        <h3 className="flex items-baseline gap-2 font-serif text-sm font-semibold text-foreground">
                                            <span className="min-w-0 truncate">
                                                {formatDateHeader(dateKey)}
                                            </span>
                                            <span className="shrink-0 text-xs font-normal text-muted-foreground tabular-nums">
                                                {media.length}
                                            </span>
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                            {media.map((m) => (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() =>
                                                        setLightboxIndex(
                                                            indexById.get(
                                                                m.id,
                                                            ) ?? 0,
                                                        )
                                                    }
                                                    className="group relative block aspect-square cursor-pointer overflow-hidden rounded-lg border border-border bg-muted transition duration-200 hover:border-primary/30 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                                    title={
                                                        m.caption ?? m.file_name
                                                    }
                                                >
                                                    {m.media_type ===
                                                    'photo' ? (
                                                        <GalleryImage
                                                            mediaId={m.id}
                                                            alt={
                                                                m.caption ||
                                                                m.file_name
                                                            }
                                                            hasThumbnail={
                                                                m.thumbnail_url !==
                                                                null
                                                            }
                                                        />
                                                    ) : (
                                                        <div className="relative size-full bg-muted">
                                                            {/* Tanpa `poster` — browser modern otomatis merender frame
                                                                pertama sebagai preview begitu metadata termuat, jadi tiap
                                                                video kelihatan beda satu sama lain (bukan kotak generik
                                                                yang sama semua). `preload="metadata"` sengaja dipakai
                                                                (bukan "auto") supaya cuma menarik metadata + frame awal,
                                                                bukan seluruh berkas — grid ini bisa memuat puluhan video. */}
                                                            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                                                            <video
                                                                src={m.url}
                                                                preload="metadata"
                                                                muted
                                                                playsInline
                                                                className="size-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                                                                <PlayCircle className="size-8 text-white drop-shadow" />
                                                            </div>
                                                        </div>
                                                    )}
                                                    {m.work_item_label && (
                                                        <span className="absolute inset-x-1.5 bottom-1.5 truncate rounded-md bg-background/85 px-1.5 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-sm">
                                                            {m.work_item_label}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                ),
                            )}
                        </div>

                        <Paginator
                            currentPage={currentPage}
                            lastPage={lastPage}
                            onNavigate={(page) => goTo(page, selectedMediaType)}
                        />
                    </>
                )}
            </div>

            <MediaLightbox
                items={lightboxItems}
                index={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
                onNavigate={setLightboxIndex}
            />
        </>
    );
}
