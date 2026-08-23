import { Head } from '@inertiajs/react';
import {
    LineChart as LineChartIcon,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { ProjectNavTabs } from '@/components/project-nav-tabs';
import { ProjectPageHeader } from '@/components/project-page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WeeklyChartPoint {
    week: string;
    week_label: string;
    planned_pct: number;
    actual_pct: number;
}

interface TableWeek {
    number: number;
    label: string;
}

interface TableRow {
    no: number;
    jenis_uraian: string;
    spesifikasi: string;
    contract_volume: number;
    unit: string | null;
    weight_pct: number;
    weekly_bobots: number[];
}

interface ProgressTable {
    weeks: TableWeek[];
    rows: TableRow[];
    weight_total: number;
    weekly_actual_pct: number[];
    weekly_planned_pct: number[];
    cumulative_actual_pct: number[];
    cumulative_planned_pct: number[];
}

interface Props {
    project: {
        id: number;
        name: string;
        job_number: string | null;
        location: string | null;
        can_view_expenses?: boolean;
    };
    kurvaS: {
        summary: { physical_pct: number; baseline_label: string };
        weekly_chart: WeeklyChartPoint[];
        table: ProgressTable;
    } | null;
}

export default function KurvaSIndex({ project, kurvaS }: Props) {
    const summary = kurvaS?.summary;
    const weeklyChart = kurvaS?.weekly_chart ?? [];
    const table = kurvaS?.table;
    const latestWeek =
        weeklyChart.length > 0 ? weeklyChart[weeklyChart.length - 1] : null;

    const physicalPct = summary?.physical_pct ?? 0;
    const deviation = latestWeek
        ? latestWeek.actual_pct - latestWeek.planned_pct
        : null;

    return (
        <>
            <Head title={`Kurva S — ${project.name}`} />
            <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <ProjectPageHeader project={project} />

                <ProjectNavTabs projectId={project.id} active="kurva-s" showExpenses={project.can_view_expenses} />

                {!kurvaS || weeklyChart.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
                        <LineChartIcon className="size-10 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                            Belum ada data progres untuk proyek ini.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Angka tunggal yang paling dicari klien ("proyek saya
                            sampai berapa persen?") diberi porsi hero sendiri,
                            bukan diminta dibaca dari ujung garis grafik. */}
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:col-span-1">
                                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                    Progres fisik
                                </p>
                                <p className="mt-1 font-serif text-4xl font-semibold text-foreground tabular-nums">
                                    {physicalPct}
                                    <span className="text-2xl text-muted-foreground">
                                        %
                                    </span>
                                </p>
                                <div
                                    className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
                                    role="progressbar"
                                    aria-valuenow={physicalPct}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-label="Progres fisik proyek"
                                >
                                    <div
                                        className="h-full rounded-full bg-primary transition-[width] duration-500"
                                        style={{
                                            width: `${Math.min(Math.max(physicalPct, 0), 100)}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            {latestWeek && (
                                <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                                    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
                                        <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                            Rencana
                                        </p>
                                        <p className="mt-1 font-serif text-2xl font-semibold tabular-nums">
                                            {latestWeek.planned_pct}%
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            minggu terakhir
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
                                        <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                            Realisasi
                                        </p>
                                        <p className="mt-1 font-serif text-2xl font-semibold tabular-nums">
                                            {latestWeek.actual_pct}%
                                        </p>
                                        {deviation !== null && (
                                            /* Arah selisih dibawa ikon + kata, bukan warna saja —
                                               supaya tetap terbaca tanpa persepsi warna. */
                                            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                                {deviation >= 0 ? (
                                                    <TrendingUp className="size-3.5 shrink-0 text-primary" />
                                                ) : (
                                                    <TrendingDown className="size-3.5 shrink-0" />
                                                )}
                                                <span className="tabular-nums">
                                                    {deviation >= 0 ? '+' : ''}
                                                    {deviation.toFixed(1)}
                                                </span>
                                                <span className="truncate">
                                                    dari rencana
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <Card className="gap-3 border-border py-5 shadow-sm">
                            <CardHeader className="px-5">
                                <CardTitle className="flex flex-col gap-0.5 font-serif text-base font-semibold">
                                    <span>Kurva S mingguan</span>
                                    <span className="text-xs font-normal text-muted-foreground">
                                        {summary?.baseline_label}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-72 px-2 sm:h-80 sm:px-5">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={weeklyChart}
                                        margin={{
                                            top: 8,
                                            right: 12,
                                            left: 0,
                                            bottom: 0,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="var(--border)"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="week_label"
                                            tick={{
                                                fontSize: 10,
                                                fill: 'var(--muted-foreground)',
                                            }}
                                            tickLine={false}
                                            axisLine={{
                                                stroke: 'var(--border)',
                                            }}
                                            interval="preserveStartEnd"
                                            minTickGap={16}
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            tick={{
                                                fontSize: 10,
                                                fill: 'var(--muted-foreground)',
                                            }}
                                            tickLine={false}
                                            axisLine={false}
                                            unit="%"
                                            width={38}
                                        />
                                        <Tooltip
                                            cursor={{
                                                stroke: 'var(--border)',
                                                strokeWidth: 1,
                                            }}
                                            contentStyle={{
                                                fontSize: 12,
                                                borderRadius:
                                                    'var(--radius-md)',
                                                border: '1px solid var(--border)',
                                                background: 'var(--popover)',
                                                color: 'var(--popover-foreground)',
                                                boxShadow: 'var(--shadow-md)',
                                            }}
                                            labelStyle={{
                                                fontWeight: 600,
                                                color: 'var(--popover-foreground)',
                                            }}
                                            formatter={(value) => [
                                                `${value}%`,
                                                undefined,
                                            ]}
                                        />
                                        <Legend
                                            wrapperStyle={{
                                                fontSize: 12,
                                                color: 'var(--muted-foreground)',
                                            }}
                                            iconType="plainline"
                                        />
                                        {/*
                                            Dua garis ini dibedakan oleh warna DAN pola sekaligus
                                            (rencana putus-putus, realisasi utuh). Pasangan warnanya
                                            sudah divalidasi untuk buta warna di app.css, dan pola
                                            garis jadi lapis kedua supaya tetap terbaca saat dicetak
                                            hitam-putih.
                                        */}
                                        <Line
                                            type="monotone"
                                            dataKey="planned_pct"
                                            name="Rencana"
                                            stroke="var(--chart-2)"
                                            strokeDasharray="6 4"
                                            dot={false}
                                            strokeWidth={2}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="actual_pct"
                                            name="Realisasi"
                                            stroke="var(--chart-1)"
                                            dot={false}
                                            strokeWidth={2.5}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {table && table.rows.length > 0 && (
                            <Card className="gap-3 border-border py-5 shadow-sm">
                                <CardHeader className="px-5">
                                    <CardTitle className="font-serif text-base font-semibold">
                                        Tabel progres per item
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-0 sm:px-5">
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[640px] border-collapse text-xs">
                                            <thead>
                                                <tr className="border-b border-border text-left text-muted-foreground uppercase">
                                                    <th className="px-3 py-2 font-medium">Uraian</th>
                                                    <th className="px-3 py-2 text-right font-medium">Volume</th>
                                                    <th className="px-3 py-2 text-right font-medium">Bobot</th>
                                                    {table.weeks.map((week) => (
                                                        <th key={week.number} className="px-3 py-2 text-right font-medium whitespace-nowrap">
                                                            Mgu {week.number}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {table.rows.map((row) => (
                                                    <tr key={row.no} className="border-b border-border/60">
                                                        <td className="px-3 py-2">
                                                            <p className="font-medium text-foreground">{row.jenis_uraian}</p>
                                                            {row.spesifikasi && (
                                                                <p className="mt-0.5 line-clamp-2 text-muted-foreground">{row.spesifikasi}</p>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                                                            {row.contract_volume} {row.unit}
                                                        </td>
                                                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                                                            {row.weight_pct.toFixed(2)}%
                                                        </td>
                                                        {row.weekly_bobots.map((bobot, i) => (
                                                            <td
                                                                key={table.weeks[i]?.number ?? i}
                                                                className={cn(
                                                                    'px-3 py-2 text-right tabular-nums',
                                                                    bobot > 0 ? 'font-medium text-foreground' : 'text-muted-foreground/50',
                                                                )}
                                                            >
                                                                {bobot > 0 ? `${(bobot * 100).toFixed(2)}%` : '—'}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t border-border font-medium text-foreground">
                                                    <td className="px-3 py-2" colSpan={2}>
                                                        Bobot realisasi mingguan
                                                    </td>
                                                    <td className="px-3 py-2 text-right tabular-nums">{table.weight_total.toFixed(2)}%</td>
                                                    {table.weekly_actual_pct.map((pct, i) => (
                                                        <td key={table.weeks[i]?.number ?? i} className="px-3 py-2 text-right tabular-nums">
                                                            {pct.toFixed(2)}%
                                                        </td>
                                                    ))}
                                                </tr>
                                                <tr className="text-muted-foreground">
                                                    <td className="px-3 py-2" colSpan={3}>
                                                        Kumulatif realisasi
                                                    </td>
                                                    {table.cumulative_actual_pct.map((pct, i) => (
                                                        <td key={table.weeks[i]?.number ?? i} className="px-3 py-2 text-right tabular-nums">
                                                            {pct.toFixed(2)}%
                                                        </td>
                                                    ))}
                                                </tr>
                                                <tr className="text-muted-foreground">
                                                    <td className="px-3 py-2" colSpan={3}>
                                                        Kumulatif rencana
                                                    </td>
                                                    {table.cumulative_planned_pct.map((pct, i) => (
                                                        <td key={table.weeks[i]?.number ?? i} className="px-3 py-2 text-right tabular-nums">
                                                            {pct.toFixed(2)}%
                                                        </td>
                                                    ))}
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
