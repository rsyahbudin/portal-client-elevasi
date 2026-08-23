import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Clock,
    CloudSun,
    Images,
    PlayCircle,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { GalleryImage } from '@/components/gallery-image';
import type { LightboxItem } from '@/components/media-lightbox';
import { MediaLightbox } from '@/components/media-lightbox';
import { ProjectNavTabs } from '@/components/project-nav-tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateID } from '@/lib/utils';

interface Media {
    id: number;
    file_name: string;
    mime_type: string;
    media_type: string;
    caption: string | null;
    url: string;
    /** null untuk video, atau bila OneDrive tidak punya turunan kecilnya. */
    thumbnail_url: string | null;
}

interface ManpowerRow {
    role: string;
    role_label: string;
    headcount: number;
    /**
     * OPSIONAL, dan memang begitu adanya — JANGAN jadikan wajib.
     * `FieldAttendanceService::manpowerSummaryForReport()` di ERP hanya
     * menyertakan `names` pada baris peran **PM**; baris tukang/kenek/helper
     * dibangun tanpa key ini sama sekali. Menganggapnya selalu ada bikin
     * `names.join()` melempar TypeError dan seluruh halaman gagal render.
     */
    names?: string[];
}

interface Props {
    project: { id: number; name: string; can_view_expenses?: boolean };
    report: {
        id: number;
        report_date: string;
        weather_morning: string | null;
        weather_afternoon: string | null;
        weather_evening: string | null;
        weather_night: string | null;
        work_hours_start: string | null;
        work_hours_end: string | null;
        summary: string | null;
        issues: string | null;
        notes: string | null;
        manpower: ManpowerRow[];
        media: Media[];
    };
}

const WEATHER_SLOTS = [
    { key: 'weather_morning' as const, label: 'Pagi' },
    { key: 'weather_afternoon' as const, label: 'Siang' },
    { key: 'weather_evening' as const, label: 'Sore' },
    { key: 'weather_night' as const, label: 'Malam' },
];

function isImage(mime: string): boolean {
    return mime.startsWith('image/');
}

export default function ReportShow({ project, report }: Props) {
    const weatherSlots = WEATHER_SLOTS.filter((slot) => report[slot.key]);
    const totalManpower = report.manpower.reduce(
        (sum, row) => sum + row.headcount,
        0,
    );

    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const lightboxItems: LightboxItem[] = report.media.map((m) => ({
        id: m.id,
        caption: m.caption,
        fileName: m.file_name,
        isVideo: !isImage(m.mime_type),
    }));

    return (
        <>
            <Head
                title={`Laporan ${formatDateID(report.report_date)} — ${project.name}`}
            />
            <div className="flex flex-col gap-5 p-4 sm:p-6 lg:p-8">
                <div className="min-w-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
                    >
                        <Link href={`/projects/${project.id}/reports`}>
                            <ArrowLeft className="mr-1.5 size-4" />
                            Semua laporan
                        </Link>
                    </Button>
                    <h1 className="font-serif text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                        {formatDateID(report.report_date)}
                    </h1>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                        {project.name}
                    </p>
                </div>

                <ProjectNavTabs projectId={project.id} active="reports" showExpenses={project.can_view_expenses} />

                {/* Cuaca dipecah per slot waktu, bukan disatukan jadi satu baris
                    panjang dipisah titik — versi gabungan terbaca sebagai
                    kalimat berantakan yang sulit dipindai di layar sempit. */}
                {(weatherSlots.length > 0 || report.work_hours_start) && (
                    <div className="flex flex-wrap gap-2">
                        {weatherSlots.map((slot) => (
                            <span
                                key={slot.key}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-xs"
                            >
                                <CloudSun className="size-3.5 shrink-0 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                    {slot.label}
                                </span>
                                <span className="font-medium text-foreground">
                                    {report[slot.key]}
                                </span>
                            </span>
                        ))}
                        {report.work_hours_start && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-xs">
                                <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                                <span className="font-medium text-foreground tabular-nums">
                                    {report.work_hours_start}
                                    {report.work_hours_end
                                        ? ` – ${report.work_hours_end}`
                                        : ''}
                                </span>
                            </span>
                        )}
                    </div>
                )}

                {report.manpower.length > 0 && (
                    <Card className="gap-4 border-border py-5 shadow-sm">
                        <CardHeader className="px-5">
                            <CardTitle className="flex items-center justify-between gap-2 font-serif text-base font-semibold">
                                <span className="flex items-center gap-2">
                                    <Users className="size-4 text-muted-foreground" />
                                    Tenaga Kerja
                                </span>
                                <span className="shrink-0 text-sm font-medium text-muted-foreground tabular-nums">
                                    {totalManpower} orang
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2 px-5">
                            {report.manpower.map((row) => (
                                <span
                                    key={row.role}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-xs text-secondary-foreground"
                                    title={
                                        row.names?.length
                                            ? row.names.join(', ')
                                            : undefined
                                    }
                                >
                                    {row.role_label}
                                    <span className="font-semibold text-foreground tabular-nums">
                                        {row.headcount}
                                    </span>
                                </span>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <Card className="gap-4 border-border py-5 shadow-sm">
                    <CardHeader className="px-5">
                        <CardTitle className="font-serif text-base font-semibold">
                            Ringkasan Pekerjaan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 px-5 text-sm">
                        <p className="leading-relaxed whitespace-pre-wrap">
                            {report.summary || '—'}
                        </p>
                        {report.issues && (
                            <div className="rounded-lg border-l-2 border-destructive bg-destructive/5 p-3.5">
                                <p className="text-xs font-semibold tracking-wide text-destructive uppercase">
                                    Kendala
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-foreground/80">
                                    {report.issues}
                                </p>
                            </div>
                        )}
                        {report.notes && (
                            <div className="rounded-lg bg-muted p-3.5">
                                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    Catatan
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                                    {report.notes}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {report.media.length > 0 && (
                    <Card className="gap-4 border-border py-5 shadow-sm">
                        <CardHeader className="px-5">
                            <CardTitle className="flex items-center justify-between gap-2 font-serif text-base font-semibold">
                                <span className="flex items-center gap-2">
                                    <Images className="size-4 text-muted-foreground" />
                                    Foto &amp; Video Lapangan
                                </span>
                                <span className="shrink-0 text-sm font-medium text-muted-foreground tabular-nums">
                                    {report.media.length}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-5">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                {report.media.map((m, i) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setLightboxIndex(i)}
                                        className="group relative block aspect-square cursor-pointer overflow-hidden rounded-lg border border-border bg-muted transition duration-200 hover:border-primary/30 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                        title={m.caption ?? m.file_name}
                                    >
                                        {isImage(m.mime_type) ? (
                                            <GalleryImage
                                                mediaId={m.id}
                                                alt={m.caption || m.file_name}
                                                hasThumbnail={
                                                    m.thumbnail_url !== null
                                                }
                                            />
                                        ) : (
                                            <div className="flex h-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
                                                <PlayCircle className="size-6" />
                                                <span className="text-[11px]">
                                                    Video
                                                </span>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
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
