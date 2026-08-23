import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

interface Props {
    projectId: number;
    active: 'reports' | 'kurva-s' | 'documentation' | 'belanja';
    /** Tab "Belanja" opt-in per proyek — cuma tampil kalau ERP mengizinkan (`project.can_view_expenses`). */
    showExpenses?: boolean;
}

const BASE_TABS = [
    { key: 'reports', label: 'Laporan Harian', segment: 'reports' },
    { key: 'kurva-s', label: 'Kurva S', segment: 'kurva-s' },
    { key: 'documentation', label: 'Dokumentasi', segment: 'documentation' },
] as const;

const EXPENSE_TAB = { key: 'belanja', label: 'Belanja', segment: 'belanja' } as const;

export function ProjectNavTabs({ projectId, active, showExpenses = false }: Props) {
    const base = `/projects/${projectId}`;
    const tabs = showExpenses ? [...BASE_TABS, EXPENSE_TAB] : BASE_TABS;

    return (
        /*
         * Segmented control: melebar penuh di mobile supaya tiap tab dapat
         * target sentuh yang layak, lalu menyusut seukuran isinya di layar
         * lebar. `overflow-x-auto` tetap dipasang sebagai pengaman kalau
         * label bertambah panjang atau tab "Belanja" (opt-in) ikut tampil.
         */
        <nav className="flex w-full gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-xs sm:w-fit">
            {tabs.map((tab) => (
                <Link
                    key={tab.key}
                    href={`${base}/${tab.segment}`}
                    aria-current={active === tab.key ? 'page' : undefined}
                    className={cn(
                        // text-xs di mobile bukan kosmetik: dengan text-sm,
                        // "Laporan Harian" butuh ~122px sedangkan tiap tab cuma
                        // kebagian ~109px di layar 375px — ketiganya jadi
                        // menggeser horizontal padahal isinya cuma tiga.
                        'flex-1 shrink-0 rounded-lg px-3 py-2 text-center text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:flex-none sm:px-4 sm:text-sm',
                        active === tab.key
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                    )}
                >
                    {tab.label}
                </Link>
            ))}
        </nav>
    );
}
