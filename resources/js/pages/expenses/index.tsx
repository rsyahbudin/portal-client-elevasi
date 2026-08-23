import { Head, router } from '@inertiajs/react';
import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';
import { Paginator } from '@/components/paginator';
import { ProjectNavTabs } from '@/components/project-nav-tabs';
import { ProjectPageHeader } from '@/components/project-page-header';
import { cn } from '@/lib/utils';

interface ExpenseRow {
    id: number;
    expense_date: string;
    category_label: string;
    is_inflow: boolean;
    description: string | null;
    vendor_name: string | null;
    quantity: number | null;
    unit: string | null;
    unit_price: number | null;
    amount: number;
    absolute_amount: number;
    running_balance: number;
}

interface CategoryTotal {
    category: string;
    type: string;
    total: number;
    count: number;
}

interface Props {
    project: {
        id: number;
        name: string;
        job_number: string | null;
        location: string | null;
    };
    expenses: {
        current_page: number;
        last_page: number;
        data: ExpenseRow[];
        summary: {
            total_inflow: number;
            total_outflow: number;
            balance: number;
            categories: CategoryTotal[];
        };
    } | null;
}

function fmtCurrency(n: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(n);
}

function fmtDate(d: string): string {
    return new Date(d).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function ExpensesIndex({ project, expenses }: Props) {
    const rows = expenses?.data ?? [];
    const summary = expenses?.summary;
    const currentPage = expenses?.current_page ?? 1;
    const lastPage = expenses?.last_page ?? 1;

    function goTo(page: number) {
        router.get(`/projects/${project.id}/belanja`, page > 1 ? { page } : {}, { preserveScroll: true });
    }

    return (
        <>
            <Head title={`Laporan Belanja — ${project.name}`} />
            <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <ProjectPageHeader project={project} />

                <ProjectNavTabs projectId={project.id} active="belanja" showExpenses />

                {!expenses || rows.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
                        <Wallet className="size-10 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">Belum ada transaksi belanja untuk proyek ini.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                                <p className="text-xs tracking-wide text-muted-foreground uppercase">Saldo dompet proyek</p>
                                <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-foreground">
                                    {fmtCurrency(summary?.balance ?? 0)}
                                </p>
                            </div>
                            <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
                                <p className="flex items-center gap-1.5 text-xs tracking-wide text-muted-foreground uppercase">
                                    <ArrowUpCircle className="size-3.5" />
                                    Pemasukan
                                </p>
                                <p className="mt-1 font-serif text-xl font-semibold tabular-nums text-foreground">
                                    {fmtCurrency(summary?.total_inflow ?? 0)}
                                </p>
                            </div>
                            <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
                                <p className="flex items-center gap-1.5 text-xs tracking-wide text-muted-foreground uppercase">
                                    <ArrowDownCircle className="size-3.5" />
                                    Pengeluaran
                                </p>
                                <p className="mt-1 font-serif text-xl font-semibold tabular-nums text-foreground">
                                    {fmtCurrency(summary?.total_outflow ?? 0)}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            {rows.map((row) => (
                                <div
                                    key={row.id}
                                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-xs sm:p-4"
                                >
                                    <span
                                        className={cn(
                                            'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
                                            row.is_inflow ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600',
                                        )}
                                    >
                                        {row.is_inflow ? <ArrowUpCircle className="size-4" /> : <ArrowDownCircle className="size-4" />}
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                                            <p className="truncate text-sm font-medium text-foreground">
                                                {row.description || row.category_label}
                                            </p>
                                            <p
                                                className={cn(
                                                    'shrink-0 text-sm font-semibold tabular-nums',
                                                    row.is_inflow ? 'text-emerald-600' : 'text-red-600',
                                                )}
                                            >
                                                {row.is_inflow ? '+' : '−'}
                                                {fmtCurrency(row.absolute_amount)}
                                            </p>
                                        </div>
                                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                                            <span>{fmtDate(row.expense_date)}</span>
                                            <span aria-hidden>·</span>
                                            <span>{row.category_label}</span>
                                            {row.vendor_name && (
                                                <>
                                                    <span aria-hidden>·</span>
                                                    <span className="truncate">{row.vendor_name}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Paginator currentPage={currentPage} lastPage={lastPage} onNavigate={goTo} />
                    </>
                )}
            </div>
        </>
    );
}
