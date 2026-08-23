import { Head, Link, router } from '@inertiajs/react';
import { Camera, ChevronRight, ClipboardList } from 'lucide-react';
import { Paginator } from '@/components/paginator';
import { ProjectNavTabs } from '@/components/project-nav-tabs';
import { ProjectPageHeader } from '@/components/project-page-header';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
        can_view_expenses?: boolean;
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

export default function ReportsIndex({
    project,
    reports,
    selectedMonth,
}: Props) {
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
            <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <ProjectPageHeader project={project} />

                <ProjectNavTabs projectId={project.id} active="reports" showExpenses={project.can_view_expenses} />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                        Laporan Harian
                    </h2>

                    {months.length > 0 && (
                        <Select
                            value={selectedMonth ?? 'all'}
                            onValueChange={(value) =>
                                goTo(1, value === 'all' ? null : value)
                            }
                        >
                            <SelectTrigger
                                size="sm"
                                className="w-full bg-card sm:w-48"
                            >
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
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
                        <ClipboardList className="size-10 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                            {selectedMonth
                                ? `Tidak ada laporan pada ${formatMonthID(selectedMonth)}.`
                                : 'Belum ada laporan harian untuk proyek ini.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-2">
                            {rows.map((r) => {
                                const chip = formatDateChip(r.report_date);

                                return (
                                    <Link
                                        key={r.id}
                                        href={`${baseUrl}/${r.id}`}
                                        className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xs transition duration-200 hover:border-primary/30 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:gap-4 sm:p-4"
                                    >
                                        <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-secondary transition-colors group-hover:bg-primary/10">
                                            <span className="font-serif text-lg leading-none font-semibold text-foreground">
                                                {chip.day}
                                            </span>
                                            <span className="mt-0.5 text-[10px] tracking-wide text-muted-foreground uppercase">
                                                {chip.month}
                                            </span>
                                        </div>

                                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                                            <p className="line-clamp-2 text-sm text-foreground sm:line-clamp-1">
                                                {r.summary ||
                                                    'Belum ada ringkasan'}
                                            </p>
                                            {r.media_count > 0 && (
                                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Camera className="size-3.5 shrink-0" />
                                                    {r.media_count} berkas
                                                </span>
                                            )}
                                        </div>

                                        <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                                    </Link>
                                );
                            })}
                        </div>

                        <Paginator
                            currentPage={currentPage}
                            lastPage={lastPage}
                            onNavigate={(page) => goTo(page, selectedMonth)}
                        />
                    </>
                )}
            </div>
        </>
    );
}
