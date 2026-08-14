import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, Building2, FolderKanban, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

/** Hanya tahap yang boleh diekspos ke klien — cocok dengan `Project::CLIENT_SAFE_STAGES` di ERP. */
const STAGE_LABELS: Record<string, string> = {
    survey: 'Survey',
    layout: 'Layout',
    desain_3d: 'Desain 3D',
    pelaksanaan: 'Pelaksanaan',
    pengujian: 'Pengujian',
    serah_terima: 'Serah Terima',
};

function ProjectCard({ project }: { project: ProjectRow }) {
    const stageLabel = project.pipeline_stage ? STAGE_LABELS[project.pipeline_stage] : null;
    const isCompleted = project.status === 'completed';

    return (
        <Link
            href={`/projects/${project.id}/reports`}
            className="group flex flex-col border border-border bg-card transition-colors duration-150 hover:border-foreground/30"
        >
            <div className="h-1 bg-primary" aria-hidden />

            <div className="flex flex-1 flex-col gap-4 px-5 pt-4 pb-4">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 min-w-0 font-serif text-lg leading-snug font-semibold text-foreground">
                        {project.name}
                    </h3>
                    <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>

                <div className="space-y-1.5 text-sm text-muted-foreground">
                    {project.location && (
                        <p className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{project.location}</span>
                        </p>
                    )}
                    {project.work_site_name && (
                        <p className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{project.work_site_name}</span>
                        </p>
                    )}
                    {project.job_number && <p className="font-mono text-xs text-muted-foreground/80">{project.job_number}</p>}
                </div>

                {(stageLabel || isCompleted || project.jenis_pekerjaan) && (
                    <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
                        {isCompleted ? (
                            <Badge variant="secondary" className="rounded-sm font-normal">
                                Selesai
                            </Badge>
                        ) : (
                            stageLabel && (
                                <Badge variant="secondary" className="rounded-sm font-normal">
                                    {stageLabel}
                                </Badge>
                            )
                        )}
                        {project.jenis_pekerjaan && (
                            <Badge variant="outline" className="rounded-sm font-normal text-muted-foreground">
                                {project.jenis_pekerjaan}
                            </Badge>
                        )}
                    </div>
                )}
            </div>
        </Link>
    );
}

export default function Dashboard({ projects, scopeLabel, erpUnreachable }: Props) {
    const { portal } = usePage<{ portal: PortalShared }>().props;
    const firstName = portal?.viewer_name?.split(' ')[0] ?? '';

    return (
        <>
            <Head title="Proyek" />
            <div className="flex flex-col gap-8 p-4 sm:p-6">
                <div className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                            {firstName ? `Halo, ${firstName}` : scopeLabel || 'Proyek'}
                        </h1>
                        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                            {scopeLabel
                                ? `Pantau progres, laporan harian, dan foto lapangan untuk ${scopeLabel}.`
                                : 'Pantau progres, laporan harian, dan foto lapangan proyek Anda bersama Elevasi Design Build.'}
                        </p>
                    </div>
                    {projects.length > 0 && (
                        <p className="text-xs tracking-wide text-muted-foreground uppercase">
                            {projects.length} proyek
                        </p>
                    )}
                </div>

                {erpUnreachable && (
                    <Alert variant="destructive">
                        <AlertTitle>Sebagian data tidak bisa dimuat</AlertTitle>
                        <AlertDescription>Coba muat ulang halaman beberapa saat lagi.</AlertDescription>
                    </Alert>
                )}

                {projects.length === 0 && !erpUnreachable && (
                    <div className="flex flex-col items-center gap-3 border border-dashed border-border py-16 text-center">
                        <FolderKanban className="h-10 w-10 text-muted-foreground/50" />
                        <div>
                            <p className="font-medium">Belum ada proyek yang terhubung</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Hubungi tim Elevasi Anda kalau ini seharusnya tidak kosong.
                            </p>
                        </div>
                    </div>
                )}

                {projects.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {projects.map((p) => (
                            <ProjectCard key={p.id} project={p} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
