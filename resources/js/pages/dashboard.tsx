import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    Building2,
    CheckCircle2,
    FolderKanban,
    HardHat,
    MapPin,
} from 'lucide-react';
import { StageTrack } from '@/components/stage-track';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { resolveStageProgress } from '@/lib/pipeline';
import type { PortalShared } from '@/types';

interface ProjectRow {
    id: number;
    name: string;
    job_number: string | null;
    status: string;
    pipeline_stage: string | null;
    location: string | null;
    jenis_pekerjaan: string | null;
    work_site_id: number | null;
    work_site_name: string | null;
}

interface Props {
    projects: ProjectRow[];
    scopeLabel: string | null;
    erpUnreachable: boolean;
}

function ProjectCard({ project }: { project: ProjectRow }) {
    const stage = resolveStageProgress(project.pipeline_stage);

    return (
        <Link
            href={`/projects/${project.id}/reports`}
            className="group flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="line-clamp-2 font-serif text-lg leading-snug font-semibold text-foreground">
                        {project.name}
                    </h3>
                    {project.job_number && (
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                            {project.job_number}
                        </p>
                    )}
                </div>
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <ArrowUpRight className="size-4" />
                </span>
            </div>

            <div className="space-y-2">
                <StageTrack step={stage.step} total={stage.total} />
                {/* Sengaja TANPA nama tahap ("Survey"/"Pelaksanaan"/dst) — ini
                    portal pelaksanaan murni, bukan pelacak proses bisnis
                    internal. Instruksi eksplisit: "tidak usah ada sama sekali
                    stage namenya". Cuma indikator posisi numerik yang tersisa. */}
                <div className="flex items-center justify-end gap-2">
                    {stage.isComplete && (
                        <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                    )}
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {stage.step > 0
                            ? `Tahap ${stage.step}/${stage.total}`
                            : 'Belum dimulai'}
                    </span>
                </div>
            </div>

            {(project.location ||
                project.work_site_name ||
                project.jenis_pekerjaan) && (
                <div className="mt-auto space-y-1.5 border-t border-border pt-3 text-sm text-muted-foreground">
                    {project.location && (
                        <p className="flex items-center gap-2">
                            <MapPin className="size-3.5 shrink-0" />
                            <span className="truncate">{project.location}</span>
                        </p>
                    )}
                    {project.work_site_name && (
                        <p className="flex items-center gap-2">
                            <Building2 className="size-3.5 shrink-0" />
                            <span className="truncate">
                                {project.work_site_name}
                            </span>
                        </p>
                    )}
                    {project.jenis_pekerjaan && (
                        <p className="flex items-center gap-2">
                            <HardHat className="size-3.5 shrink-0" />
                            <span className="truncate">
                                {project.jenis_pekerjaan}
                            </span>
                        </p>
                    )}
                </div>
            )}
        </Link>
    );
}

function SummaryStat({ value, label }: { value: number; label: string }) {
    return (
        // px-3 di mobile: tiga ubin dalam 375px cuma kebagian ~107px, padding
        // penuh menyisakan terlalu sedikit ruang untuk labelnya.
        <div className="rounded-xl border border-border bg-card px-3 py-3 shadow-xs sm:px-4">
            <p className="font-serif text-2xl font-semibold text-foreground tabular-nums">
                {value}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
        </div>
    );
}

export default function Dashboard({
    projects,
    scopeLabel,
    erpUnreachable,
}: Props) {
    const { portal } = usePage<{ portal: PortalShared }>().props;
    const firstName = portal?.viewer_name?.split(' ')[0] ?? '';

    const stages = projects.map((p) => resolveStageProgress(p.pipeline_stage));
    const runningCount = stages.filter(
        (s) => s.step > 0 && !s.isComplete,
    ).length;
    const completedCount = stages.filter((s) => s.isComplete).length;

    return (
        <>
            <Head title="Proyek" />
            <div className="flex flex-col gap-6 p-4 sm:gap-8 sm:p-6 lg:p-8">
                <header className="min-w-0">
                    <h1 className="font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                        {firstName
                            ? `Halo, ${firstName}`
                            : scopeLabel || 'Proyek'}
                    </h1>
                    <p className="mt-2 max-w-lg text-sm text-muted-foreground sm:text-base">
                        {scopeLabel
                            ? `Pantau progres, laporan harian, dan foto lapangan untuk ${scopeLabel}.`
                            : 'Pantau progres, laporan harian, dan foto lapangan proyek Anda bersama Elevasi Design Build.'}
                    </p>
                </header>

                {erpUnreachable && (
                    <Alert variant="destructive">
                        <AlertTitle>Sebagian data tidak bisa dimuat</AlertTitle>
                        <AlertDescription>
                            Coba muat ulang halaman beberapa saat lagi.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Ringkasan hanya berguna kalau ada beberapa proyek — untuk PIN
                    satu proyek, angkanya cuma mengulang isi kartu di bawahnya. */}
                {projects.length > 1 && (
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                        <SummaryStat
                            value={projects.length}
                            label="Total proyek"
                        />
                        <SummaryStat
                            value={runningCount}
                            label="Sedang berjalan"
                        />
                        <SummaryStat
                            value={completedCount}
                            label="Serah terima"
                        />
                    </div>
                )}

                {projects.length === 0 && !erpUnreachable && (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
                        <FolderKanban className="size-10 text-muted-foreground/40" />
                        <div>
                            <p className="font-medium text-foreground">
                                Belum ada proyek yang terhubung
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Hubungi tim Elevasi Anda kalau ini seharusnya
                                tidak kosong.
                            </p>
                        </div>
                    </div>
                )}

                {projects.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {projects.map((p) => (
                            <ProjectCard key={p.id} project={p} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
