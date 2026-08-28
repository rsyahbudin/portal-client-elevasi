import { Head, router } from '@inertiajs/react';
import { ArrowDownCircle, ArrowUpCircle, BarChart3, List, Wallet, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { ExpenseDailyChart, type ExpenseDailyRow } from '@/components/expense-daily-chart';
import { Paginator } from '@/components/paginator';
import { ProjectNavTabs } from '@/components/project-nav-tabs';
import { ProjectPageHeader } from '@/components/project-page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
        daily: ExpenseDailyRow[];
        date_from: string;
        date_to: string;
    } | null;
    filters: {
        date_from: string | null;
        date_to: string | null;
    };
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

export default function ExpensesIndex({ project, expenses, filters }: Props) {
    const rows = expenses?.data ?? [];
    const summary = expenses?.summary;
    const currentPage = expenses?.current_page ?? 1;
    const lastPage = expenses?.last_page ?? 1;
    const [view, setView] = useState<'list' | 'stats'>('list');

    // Rentang aktif untuk mengisi input tanggal — pakai rentang yang di-resolve
    // ERP (default: seluruh transaksi) kalau user belum pernah memfilter.
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? expenses?.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? expenses?.date_to ?? '');
    const hasActiveFilter = !!(filters.date_from || filters.date_to);

    function goTo(page: number) {
        router.get(
            `/projects/${project.id}/belanja`,
            { ...(page > 1 ? { page } : {}), ...(filters.date_from ? { date_from: filters.date_from } : {}), ...(filters.date_to ? { date_to: filters.date_to } : {}) },
            { preserveScroll: true },
        );
    }

    function applyFilter(e: FormEvent) {
        e.preventDefault();
        router.get(
            `/projects/${project.id}/belanja`,
            { ...(dateFrom ? { date_from: dateFrom } : {}), ...(dateTo ? { date_to: dateTo } : {}) },
            { preserveScroll: true },
        );
    }

    function resetFilter() {
        setDateFrom('');
        setDateTo('');
        router.get(`/projects/${project.id}/belanja`, {}, { preserveScroll: true });
    }

    return (
        <>
            <Head title={`Laporan Belanja — ${project.name}`} />
            <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <ProjectPageHeader project={project} />

                <ProjectNavTabs projectId={project.id} active="belanja" showExpenses />

                {/* Filter tanggal */}
                <form onSubmit={applyFilter} className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
                    <div className="space-y-1">
                        <Label htmlFor="date_from" className="text-xs text-muted-foreground">Dari tanggal</Label>
                        <Input
                            id="date_from"
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="h-9 w-40 text-sm"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="date_to" className="text-xs text-muted-foreground">Sampai tanggal</Label>
                        <Input
                            id="date_to"
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="h-9 w-40 text-sm"
                        />
                    </div>
                    <Button type="submit" size="sm" className="h-9">
                        Terapkan
                    </Button>
                    {hasActiveFilter && (
                        <Button type="button" variant="ghost" size="sm" className="h-9 gap-1 text-muted-foreground" onClick={resetFilter}>
                            <X className="size-3.5" /> Reset
                        </Button>
                    )}

                    <div className="ml-auto flex items-center gap-1 rounded-lg border border-border p-0.5">
                        <button
                            type="button"
                            onClick={() => setView('list')}
                            className={cn(
                                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                view === 'list' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <List className="size-3.5" /> Daftar
                        </button>
                        <button
                            type="button"
                            onClick={() => setView('stats')}
                            className={cn(
                                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                view === 'stats' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <BarChart3 className="size-3.5" /> Statistik
                        </button>
                    </div>
                </form>

                {!expenses || (rows.length === 0 && (expenses.daily?.length ?? 0) === 0) ? (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
                        <Wallet className="size-10 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                            {hasActiveFilter ? 'Tidak ada transaksi di rentang tanggal ini.' : 'Belum ada transaksi belanja untuk proyek ini.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                                <p className="text-xs tracking-wide text-muted-foreground uppercase">Saldo dompet proyek</p>
                                <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-foreground">
                                    {fmtCurrency(summary?.balance ?? 0)}
                                </p>
                                <p className="mt-0.5 text-[11px] text-muted-foreground">Saldo saat ini — tidak terpengaruh filter tanggal</p>
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

                        {view === 'stats' ? (
                            <ExpenseDailyChart days={expenses.daily ?? []} />
                        ) : (
                            <>
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
                    </>
                )}
            </div>
        </>
    );
}
