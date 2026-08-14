import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

interface Props {
    projectId: number;
    active: 'reports' | 'kurva-s' | 'documentation';
}

const TABS = [
    { key: 'reports', label: 'Laporan Harian', segment: 'reports' },
    { key: 'kurva-s', label: 'Kurva S', segment: 'kurva-s' },
    { key: 'documentation', label: 'Dokumentasi', segment: 'documentation' },
] as const;

export function ProjectNavTabs({ projectId, active }: Props) {
    const base = `/projects/${projectId}`;

    return (
        <div className="flex gap-5 overflow-x-auto border-b border-border">
            {TABS.map((tab) => (
                <Link
                    key={tab.key}
                    href={`${base}/${tab.segment}`}
                    className={cn(
                        'shrink-0 border-b-2 pb-2.5 text-sm whitespace-nowrap transition-colors',
                        active === tab.key
                            ? 'border-foreground font-medium text-foreground'
                            : 'border-transparent text-muted-foreground hover:text-foreground',
                    )}
                >
                    {tab.label}
                </Link>
            ))}
        </div>
    );
}
