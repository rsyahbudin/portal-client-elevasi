import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, LineChart as LineChartIcon, MapPin } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WeeklyChartPoint {
    week: string;
    week_label: string;
    planned_pct: number;
    actual_pct: number;
}

interface Props {
    project: {
        id: number;
        name: string;
        job_number: string | null;
        location: string | null;
    };
    kurvaS: {
        summary: { physical_pct: number; baseline_label: string };
        weekly_chart: WeeklyChartPoint[];
    } | null;
}

export default function KurvaSIndex({ project, kurvaS }: Props) {
    const summary = kurvaS?.summary;
    const weeklyChart = kurvaS?.weekly_chart ?? [];
    const latestWeek = weeklyChart.length > 0 ? weeklyChart[weeklyChart.length - 1] : null;

    return (
        <>
            <Head title={`Kurva S — ${project.name}`} />
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

                <ProjectNavTabs projectId={project.id} active="kurva-s" />

                {!kurvaS || weeklyChart.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 border border-dashed border-border py-16 text-center">
                        <LineChartIcon className="h-10 w-10 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">Belum ada data progres untuk proyek ini.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap items-end gap-6 border-b border-border pb-6">
                            <div className="space-y-1">
                                <p className="text-xs tracking-wide text-muted-foreground uppercase">Progres fisik proyek</p>
                                <p className="font-serif text-3xl font-semibold tabular-nums">{summary?.physical_pct}%</p>
                            </div>
                            {latestWeek && (
                                <div className="flex flex-wrap gap-4 text-sm">
                                    <div>
                                        <p className="text-xs tracking-wide text-muted-foreground uppercase">Rencana minggu ini</p>
                                        <p className="tabular-nums">{latestWeek.planned_pct}%</p>
                                    </div>
                                    <div>
                                        <p className="text-xs tracking-wide text-muted-foreground uppercase">Realisasi</p>
                                        <p className="tabular-nums">{latestWeek.actual_pct}%</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Card className="rounded-none border-border shadow-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex flex-col gap-0.5 font-serif text-base font-semibold">
                                    <span>Kurva S mingguan</span>
                                    <span className="text-xs font-normal text-muted-foreground">{summary?.baseline_label}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-64 sm:h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={weeklyChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis
                                            dataKey="week_label"
                                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                            tickLine={false}
                                            axisLine={{ stroke: 'var(--border)' }}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                            tickLine={false}
                                            axisLine={{ stroke: 'var(--border)' }}
                                            unit="%"
                                            width={36}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                fontSize: 12,
                                                borderRadius: 0,
                                                border: '1px solid var(--border)',
                                                background: 'var(--card)',
                                                color: 'var(--foreground)',
                                            }}
                                            labelStyle={{ fontWeight: 600, color: 'var(--foreground)' }}
                                            formatter={(value) => [`${value}%`, undefined]}
                                        />
                                        <Legend wrapperStyle={{ fontSize: 12, color: 'var(--foreground)' }} />
                                        {/* Satu-satunya tempat di app ini yang sengaja keluar dari palet
                                            monokrom (lihat resources/css/app.css) — dua garis kurva S butuh
                                            beda warna SEKALIGUS beda pola supaya rencana vs realisasi tetap
                                            jelas dibedakan (termasuk untuk yang buta warna atau print B&W). */}
                                        <Line
                                            type="monotone"
                                            dataKey="planned_pct"
                                            name="Rencana"
                                            stroke="#2563eb"
                                            strokeDasharray="6 4"
                                            dot={false}
                                            strokeWidth={2}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="actual_pct"
                                            name="Realisasi"
                                            stroke="#16a34a"
                                            dot={false}
                                            strokeWidth={2.5}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </>
    );
}
