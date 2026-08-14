import { Head, Link } from '@inertiajs/react';
import { Clock, ArrowLeft, CloudSun, Images, PlayCircle, Users } from 'lucide-react';
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
}

interface ManpowerRow {
    role: string;
    role_label: string;
    headcount: number;
    names?: string[];
}

interface Props {
    project: { id: number; name: string };
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

/**
 * `media.url` dari API ERP menunjuk langsung ke endpoint ERP yang digerbangi
 * Sanctum Bearer token (tidak pernah dikirim ke browser) — harus lewat
 * proxy milik portal sendiri (FileProxyController) yang menyisipkan token
 * di sisi server.
 */
function proxyUrl(mediaId: number): string {
    return `/files/daily-report-media/${mediaId}`;
}

export default function ReportShow({ project, report }: Props) {
    const weatherSlots = WEATHER_SLOTS.filter((slot) => report[slot.key]);

    return (
        <>
            <Head title={`Laporan ${formatDateID(report.report_date)} — ${project.name}`} />
            <div className="flex flex-col gap-5 p-4 sm:p-6">
                <div>
                    <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 text-muted-foreground">
                        <Link href={`/projects/${project.id}/reports`}>
                            <ArrowLeft className="mr-1.5 h-4 w-4" />
                            Semua laporan
                        </Link>
                    </Button>
                    <h1 className="font-serif text-2xl font-semibold tracking-tight">{formatDateID(report.report_date)}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">{project.name}</p>
                </div>

                <ProjectNavTabs projectId={project.id} active="reports" />

                {(weatherSlots.length > 0 || report.work_hours_start) && (
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {weatherSlots.length > 0 && (
                            <span className="flex items-center gap-1.5">
                                <CloudSun className="h-4 w-4" />
                                {weatherSlots.map((slot) => `${slot.label}: ${report[slot.key]}`).join(' · ')}
                            </span>
                        )}
                        {report.work_hours_start && (
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                {report.work_hours_start}
                                {report.work_hours_end ? ` – ${report.work_hours_end}` : ''}
                            </span>
                        )}
                    </div>
                )}

                {report.manpower.length > 0 && (
                    <Card className="rounded-none border-border shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-serif text-base font-semibold">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                Tenaga Kerja
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {report.manpower.map((row) => (
                                <span
                                    key={row.role}
                                    className="border border-border px-2.5 py-1 text-xs text-foreground"
                                    title={row.names && row.names.length > 0 ? row.names.join(', ') : undefined}
                                >
                                    {row.role_label}: <span className="font-semibold">{row.headcount}</span>
                                </span>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <Card className="rounded-none border-border shadow-none">
                    <CardHeader>
                        <CardTitle className="font-serif text-base font-semibold">Ringkasan Pekerjaan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <p className="whitespace-pre-wrap leading-relaxed">{report.summary || '—'}</p>
                        {report.issues && (
                            <div className="border-l-2 border-foreground bg-muted p-3.5">
                                <p className="text-xs font-semibold tracking-wide text-foreground uppercase">Kendala</p>
                                <p className="mt-1 whitespace-pre-wrap text-foreground/80">{report.issues}</p>
                            </div>
                        )}
                        {report.notes && (
                            <div>
                                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Catatan</p>
                                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{report.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {report.media.length > 0 && (
                    <Card className="rounded-none border-border shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-serif text-base font-semibold">
                                <Images className="h-4 w-4 text-muted-foreground" />
                                Foto &amp; Video Lapangan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                {report.media.map((m) => (
                                    <a
                                        key={m.id}
                                        href={proxyUrl(m.id)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="group relative block aspect-square overflow-hidden border border-border bg-muted"
                                    >
                                        {isImage(m.mime_type) ? (
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
                                    </a>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
