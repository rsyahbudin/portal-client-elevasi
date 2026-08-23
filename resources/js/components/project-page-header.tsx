import { Link } from '@inertiajs/react';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    project: {
        id: number;
        name: string;
        job_number: string | null;
        location: string | null;
    };
}

/**
 * Kepala halaman proyek — dipakai bersama oleh Laporan Harian, Kurva S, dan
 * Dokumentasi supaya judul, tombol kembali, dan metadata proyek persis sama
 * di ketiganya (sebelumnya blok ini disalin tiga kali dan mulai menyimpang).
 */
export function ProjectPageHeader({ project }: Props) {
    return (
        <div className="min-w-0">
            <Button
                variant="ghost"
                size="sm"
                asChild
                className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
            >
                <Link href="/dashboard">
                    <ArrowLeft className="mr-1.5 size-4" />
                    Proyek Saya
                </Link>
            </Button>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-balance break-words sm:text-3xl">
                {project.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {project.location && (
                    <span className="flex min-w-0 items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0" />
                        <span className="truncate">{project.location}</span>
                    </span>
                )}
                {project.job_number && (
                    <span className="font-mono text-xs">
                        {project.job_number}
                    </span>
                )}
            </div>
        </div>
    );
}
