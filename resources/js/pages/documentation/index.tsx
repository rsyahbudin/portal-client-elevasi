import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ChevronLeft, ChevronRight, Images, MapPin, PlayCircle } from 'lucide-react';
import { ProjectNavTabs } from '@/components/project-nav-tabs';
import { Button } from '@/components/ui/button';
import { cn, formatDateID } from '@/lib/utils';

interface MediaItem {
    id: number;
    file_name: string;
    media_type: string;
    caption: string | null;
    report_date: string | null;
    work_item_label: string;
    url: string;
}

interface Props {
    project: {
        id: number;
        name: string;
        job_number: string | null;
        location: string | null;
    };
    documentation: {
        data: MediaItem[];
        current_page?: number;
        last_page?: number;
        stats?: { total: number; photos: number; videos: number };
    } | null;
    selectedMediaType: string | null;
}

/**
 * `media.url` dari API ERP menunjuk langsung ke endpoint ERP yang digerbangi
 * Sanctum Bearer token (tidak pernah dikirim ke browser) — harus lewat
 * proxy milik portal sendiri (FileProxyController) yang menyisipkan token
 * di sisi server.
 */
function proxyUrl(mediaId: number): string {
    return `/files/daily-report-media/${mediaId}`;
}

function groupByWorkItem(items: MediaItem[]): Map<string, MediaItem[]> {
    const groups = new Map<string, MediaItem[]>();
    for (const item of items) {
        const key = item.work_item_label;
        const existing = groups.get(key);
        if (existing) {
            existing.push(item);
        } else {
            groups.set(key, [item]);
        }
    }
    return groups;
}

export default function DocumentationIndex({ project, documentation, selectedMediaType }: Props) {
    const items = documentation?.data ?? [];
    const currentPage = documentation?.current_page ?? 1;
    const lastPage = documentation?.last_page ?? 1;
    const stats = documentation?.stats;
    const groups = groupByWorkItem(items);

    const baseUrl = `/projects/${project.id}/documentation`;

    function goTo(page: number, mediaType: string | null | undefined) {
        router.get(
            baseUrl,
            { ...(mediaType ? { media_type: mediaType } : {}), ...(page > 1 ? { page } : {}) },
            { preserveScroll: true },
        );
    }

    return (
        <>
            <Head title={`Dokumentasi — ${project.name}`} />
            <div className="flex flex-col gap-6 p-4 sm:p-6">
                <div>
                    <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 text-muted-foreground">
                        <Link href="/dashboard">
                            <ArrowLeft className="mr-1.5 h-4 w-4" />
                            Proyek Saya
                        </Link>
                    </Button>
                    <div className="border-b border-border pb-6">
                        <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">{project.name}</h1>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            {project.location && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {project.location}
                                </span>
                            )}
                            {project.job_number && <span className="font-mono text-xs">{project.job_number}</span>}
                        </div>
                    </div>
                </div>

                <ProjectNavTabs projectId={project.id} active="documentation" />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                        Dokumentasi{stats ? ` — ${stats.total} berkas` : ''}
                    </h2>

                    <div className="flex gap-1">
                        {[
                            { value: null, label: 'Semua' },
                            { value: 'photo', label: 'Foto' },
                            { value: 'video', label: 'Video' },
                        ].map((opt) => (
                            <button
                                key={opt.label}
                                type="button"
                                onClick={() => goTo(1, opt.value)}
                                className={cn(
                                    'border px-3 py-1.5 text-xs transition-colors',
                                    (selectedMediaType ?? null) === opt.value
                                        ? 'border-foreground bg-foreground text-background'
                                        : 'border-border text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 border border-dashed border-border py-16 text-center">
                        <Images className="h-10 w-10 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">Belum ada dokumentasi untuk proyek ini.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-8">
                            {Array.from(groups.entries()).map(([label, media]) => (
                                <div key={label} className="flex flex-col gap-3">
                                    <h3 className="font-serif text-sm font-semibold text-foreground">{label}</h3>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                        {media.map((m) => (
                                            <a
                                                key={m.id}
                                                href={proxyUrl(m.id)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="group relative block aspect-square overflow-hidden border border-border bg-muted"
                                                title={m.caption ?? m.file_name}
                                            >
                                                {m.media_type === 'photo' ? (
                                                    <img
                                                        src={proxyUrl(m.id)}
                                                        alt={m.caption || m.file_name}
                                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
                                                        <PlayCircle className="h-6 w-6" />
                                                        <span className="text-[11px]">Video</span>
                                                    </div>
                                                )}
                                                {m.report_date && (
                                                    <span className="absolute right-1 bottom-1 bg-background/80 px-1.5 py-0.5 text-[10px] text-foreground">
                                                        {formatDateID(m.report_date)}
                                                    </span>
                                                )}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {lastPage > 1 && (
                            <div className="flex items-center justify-between border-t border-border pt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage <= 1}
                                    onClick={() => goTo(currentPage - 1, selectedMediaType)}
                                >
                                    <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                                    Sebelumnya
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                    Halaman {currentPage} dari {lastPage}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage >= lastPage}
                                    onClick={() => goTo(currentPage + 1, selectedMediaType)}
                                >
                                    Berikutnya
                                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
