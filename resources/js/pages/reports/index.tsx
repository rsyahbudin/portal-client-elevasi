import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Camera, ChevronLeft, ChevronRight, ClipboardList, MapPin } from 'lucide-react';
import { ProjectNavTabs } from '@/components/project-nav-tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateChip, formatMonthID } from '@/lib/utils';

interface ReportRow {
    id: number;
    report_date: string;
    summary: string | null;
    media_count: number;
}

interface PageLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    project: {
        id: number;
        name: string;
        job_number: string | null;
        location: string | null;
    };
    reports: {
        data: ReportRow[];
        links?: PageLink[];
        current_page?: number;
        last_page?: number;
        available_months?: string[];
    } | null;
    selectedMonth: string | null;
}

export default function ReportsIndex({ project, reports, selectedMonth }: Props) {
    const rows = reports?.data ?? [];
    const months = reports?.available_months ?? [];
    const currentPage = reports?.current_page ?? 1;
    const lastPage = reports?.last_page ?? 1;

    const baseUrl = `/projects/${project.id}/reports`;

    function goTo(page: number, month: string | null | undefined) {
        router.get(
            baseUrl,
            { ...(month ? { month } : {}), ...(page > 1 ? { page } : {}) },
            { preserveScroll: true },
        );
    }

    return (
        <>
            <Head title={`Laporan Harian — ${project.name}`} />
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

                <ProjectNavTabs projectId={project.id} active="reports" />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Laporan Harian</h2>

                    {months.length > 0 && (
                        <Select
                            value={selectedMonth ?? 'all'}
                            onValueChange={(value) => goTo(1, value === 'all' ? null : value)}
                        >
                            <SelectTrigger size="sm" className="w-44">
                                <SelectValue placeholder="Semua bulan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua bulan</SelectItem>
                                {months.map((m) => (
                                    <SelectItem key={m} value={m}>
                                        {formatMonthID(m)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {rows.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 border border-dashed border-border py-16 text-center">
                        <ClipboardList className="h-10 w-10 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                            {selectedMonth
                                ? `Tidak ada laporan pada ${formatMonthID(selectedMonth)}.`
                                : 'Belum ada laporan harian untuk proyek ini.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col divide-y divide-border border-t border-border">
                            {rows.map((r) => {
                                const chip = formatDateChip(r.report_date);
                                return (
                                    <Link
                                        key={r.id}
                                        href={`${baseUrl}/${r.id}`}
                                        className="group flex items-center gap-4 bg-card px-2 py-3.5 transition-colors hover:bg-muted/50 sm:px-3"
                                    >
                                        <div className="flex size-12 shrink-0 flex-col items-center justify-center border border-border">
                                            <span className="font-serif text-lg leading-none font-semibold text-foreground">
                                                {chip.day}
                                            </span>
                                            <span className="mt-0.5 text-[10px] tracking-wide text-muted-foreground uppercase">
                                                {chip.month}
                                            </span>
                                        </div>
                                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                            <p className="line-clamp-1 text-sm text-foreground">{r.summary || 'Belum ada ringkasan'}</p>
                                        </div>
                                        {r.media_count > 0 && (
                                            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                                                <Camera className="h-3.5 w-3.5" />
                                                {r.media_count}
                                            </span>
                                        )}
                                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                                    </Link>
                                );
                            })}
                        </div>

                        {lastPage > 1 && (
                            <div className="flex items-center justify-between border-t border-border pt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage <= 1}
                                    onClick={() => goTo(currentPage - 1, selectedMonth)}
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
                                    onClick={() => goTo(currentPage + 1, selectedMonth)}
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
