import { Head, router } from '@inertiajs/react';
import { ArrowDownCircle, ArrowUpCircle, BarChart3, ChevronDown, ChevronsUpDown, ChevronUp, List, Search, Wallet, X } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { ExpenseDailyChart, type ExpenseDailyRow } from '@/components/expense-daily-chart';
import { ProjectNavTabs } from '@/components/project-nav-tabs';
import { ProjectPageHeader } from '@/components/project-page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

type SortKey =
    | 'expense_date'
    | 'description'
    | 'category_label'
    | 'vendor_name'
    | 'quantity'
    | 'unit'
    | 'unit_price'
    | 'amount'
    | 'running_balance';
type SortDirection = 'asc' | 'desc';

const NUMERIC_KEYS: SortKey[] = ['expense_date', 'quantity', 'unit_price', 'amount', 'running_balance'];

const COLUMNS: { key: SortKey; label: string; align?: 'right'; title?: string }[] = [
    { key: 'expense_date', label: 'Tanggal' },
    { key: 'description', label: 'Uraian' },
    { key: 'category_label', label: 'Kategori' },
    { key: 'vendor_name', label: 'Vendor' },
    { key: 'quantity', label: 'Qty', align: 'right' },
    { key: 'unit', label: 'Satuan' },
    { key: 'unit_price', label: 'Harga Satuan', align: 'right' },
    { key: 'amount', label: 'Jumlah', align: 'right' },
    {
        key: 'running_balance',
        label: 'Sisa saldo',
        align: 'right',
        title: 'Saldo dompet proyek tepat setelah transaksi ini terjadi — nilainya tetap (tidak dihitung ulang) walau tabel diurutkan berdasarkan kolom lain.',
    },
];

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

function sortRows(rows: ExpenseRow[], key: SortKey, direction: SortDirection): ExpenseRow[] {
    const sign = direction === 'asc' ? 1 : -1;

    return [...rows].sort((a, b) => {
        if (NUMERIC_KEYS.includes(key)) {
            // null diperlakukan sebagai "paling kecil" — baris tanpa qty/harga
            // satuan (mis. transaksi non-material) selalu jatuh ke ujung urutan.
            const av = key === 'expense_date' ? a.expense_date : (a[key] as number | null) ?? -Infinity;
            const bv = key === 'expense_date' ? b.expense_date : (b[key] as number | null) ?? -Infinity;
            if (av === bv) return 0;
            return av < bv ? -1 * sign : 1 * sign;
        }

        const av = String((key === 'description' ? a.description || a.category_label : a[key]) ?? '');
        const bv = String((key === 'description' ? b.description || b.category_label : b[key]) ?? '');
        return av.localeCompare(bv, 'id-ID') * sign;
    });
}

function matchesSearch(row: ExpenseRow, query: string): boolean {
    const haystack = [
        row.description,
        row.category_label,
        row.vendor_name,
        row.unit,
        row.quantity != null ? String(row.quantity) : null,
        row.unit_price != null ? String(row.unit_price) : null,
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    return haystack.includes(query.toLowerCase());
}

function fmtNumber(n: number): string {
    return new Intl.NumberFormat('id-ID').format(n);
}

export default function ExpensesIndex({ project, expenses, filters }: Props) {
    const rawRows = expenses?.data ?? [];
    const summary = expenses?.summary;
    const [view, setView] = useState<'list' | 'stats'>('list');
    const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'expense_date', direction: 'desc' });
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');

    const categoryOptions = useMemo(
        () => [...new Set(rawRows.map((row) => row.category_label))].sort((a, b) => a.localeCompare(b, 'id-ID')),
        [rawRows],
    );

    const filteredRows = useMemo(() => {
        const q = search.trim();
        return rawRows
            .filter((row) => category === 'all' || row.category_label === category)
            .filter((row) => q === '' || matchesSearch(row, q));
    }, [rawRows, search, category]);
    const rows = useMemo(() => sortRows(filteredRows, sort.key, sort.direction), [filteredRows, sort]);

    function toggleSort(key: SortKey) {
        setSort((prev) => {
            if (prev.key !== key) return { key, direction: 'desc' };
            return { key, direction: prev.direction === 'desc' ? 'asc' : 'desc' };
        });
    }

    // Rentang aktif untuk mengisi input tanggal — pakai rentang yang di-resolve
    // ERP (default: seluruh transaksi) kalau user belum pernah memfilter.
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? expenses?.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? expenses?.date_to ?? '');
    const hasActiveFilter = !!(filters.date_from || filters.date_to);

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

                {/* Filter tanggal — mobile: semua ditumpuk penuh-lebar, rapi & tidak berdesakan */}
                <form onSubmit={applyFilter} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs sm:hidden">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="date_from_m" className="text-xs text-muted-foreground">Dari tanggal</Label>
                            <Input
                                id="date_from_m"
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="h-9 w-full text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="date_to_m" className="text-xs text-muted-foreground">Sampai tanggal</Label>
                            <Input
                                id="date_to_m"
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="h-9 w-full text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Kategori</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="h-9 w-full text-sm">
                                <SelectValue placeholder="Semua kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua kategori</SelectItem>
                                {categoryOptions.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Cari uraian, kategori, vendor…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9 w-full pl-8 text-sm"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit" size="sm" className="h-9 flex-1">
                            Terapkan
                        </Button>
                        {hasActiveFilter && (
                            <Button type="button" variant="ghost" size="sm" className="h-9 gap-1 text-muted-foreground" onClick={resetFilter}>
                                <X className="size-3.5" /> Reset
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
                        <button
                            type="button"
                            onClick={() => setView('list')}
                            className={cn(
                                'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                view === 'list' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <List className="size-3.5" /> Daftar
                        </button>
                        <button
                            type="button"
                            onClick={() => setView('stats')}
                            className={cn(
                                'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                view === 'stats' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <BarChart3 className="size-3.5" /> Statistik
                        </button>
                    </div>
                </form>

                {/* Filter tanggal — tablet & desktop */}
                <form onSubmit={applyFilter} className="hidden flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 shadow-xs sm:flex">
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

                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Kategori</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="h-9 w-44 text-sm">
                                <SelectValue placeholder="Semua kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua kategori</SelectItem>
                                {categoryOptions.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="relative ml-auto w-full sm:w-56">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Cari uraian, kategori, vendor…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9 pl-8 text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
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

                {!expenses || (rawRows.length === 0 && (expenses.daily?.length ?? 0) === 0) ? (
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
                                <p className="text-xs text-muted-foreground">
                                    &quot;Sisa saldo&quot; di tiap baris adalah saldo tepat setelah transaksi itu terjadi —
                                    kalau rentang tanggal di atas tidak mencakup sampai hari ini, angkanya bisa beda
                                    dari &quot;Saldo dompet proyek&quot; yang selalu menampilkan saldo terkini.
                                </p>
                                {/* Mobile: urutkan + kartu (tabel terlalu banyak kolom untuk layar sempit) */}
                                <div className="flex items-center gap-2 sm:hidden">
                                    <Select value={sort.key} onValueChange={(key) => setSort({ key: key as SortKey, direction: 'desc' })}>
                                        <SelectTrigger className="h-9 flex-1 text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COLUMNS.map((col) => (
                                                <SelectItem key={col.key} value={col.key}>
                                                    Urutkan: {col.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 shrink-0"
                                        onClick={() => setSort((prev) => ({ ...prev, direction: prev.direction === 'desc' ? 'asc' : 'desc' }))}
                                        title={sort.direction === 'desc' ? 'Menurun' : 'Menaik'}
                                    >
                                        {sort.direction === 'desc' ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
                                    </Button>
                                </div>
                                <div className="flex flex-col gap-2 sm:hidden">
                                    {rows.map((row) => (
                                        <div key={row.id} className="rounded-xl border border-border bg-card p-3 shadow-xs">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex min-w-0 items-start gap-2">
                                                    {row.is_inflow ? (
                                                        <ArrowUpCircle className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                                                    ) : (
                                                        <ArrowDownCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium break-words text-foreground">
                                                            {row.description || row.category_label}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            {fmtDate(row.expense_date)} · {row.category_label}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p
                                                    className={cn(
                                                        'shrink-0 text-right text-sm font-semibold tabular-nums',
                                                        row.is_inflow ? 'text-emerald-600' : 'text-red-600',
                                                    )}
                                                >
                                                    {row.is_inflow ? '+' : '−'}
                                                    {fmtCurrency(row.absolute_amount)}
                                                </p>
                                            </div>
                                            <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-lg bg-muted/30 px-3 py-2 text-xs">
                                                <div className="flex justify-between gap-2">
                                                    <span className="text-muted-foreground">Vendor</span>
                                                    <span className="truncate text-right font-medium">{row.vendor_name || '—'}</span>
                                                </div>
                                                <div className="flex justify-between gap-2">
                                                    <span className="text-muted-foreground">Qty</span>
                                                    <span className="text-right font-medium tabular-nums">
                                                        {row.quantity != null ? fmtNumber(row.quantity) : '—'} {row.unit || ''}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between gap-2">
                                                    <span className="text-muted-foreground">Harga satuan</span>
                                                    <span className="text-right font-medium tabular-nums">
                                                        {row.unit_price != null ? fmtCurrency(row.unit_price) : '—'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between gap-2">
                                                    <span className="text-muted-foreground">Sisa saldo</span>
                                                    <span className="text-right font-semibold tabular-nums text-foreground">
                                                        {fmtCurrency(row.running_balance)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {rows.length === 0 && (
                                        <div className="rounded-xl border border-dashed border-border bg-card/50 px-4 py-10 text-center text-sm text-muted-foreground">
                                            {search.trim() !== ''
                                                ? <>Tidak ada transaksi yang cocok dengan pencarian &quot;{search}&quot;.</>
                                                : 'Tidak ada transaksi untuk kategori ini.'}
                                        </div>
                                    )}
                                </div>

                                {/* Desktop & tablet: tabel penuh */}
                                <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-xs sm:block">
                                    <div className="overflow-x-auto">
                                    <table className="w-full min-w-[980px] table-fixed text-sm lg:min-w-0">
                                        <colgroup>
                                            <col className="w-[8%]" />
                                            <col className="w-[24%]" />
                                            <col className="w-[13%]" />
                                            <col className="w-[13%]" />
                                            <col className="w-[6%]" />
                                            <col className="w-[7%]" />
                                            <col className="w-[10%]" />
                                            <col className="w-[9%]" />
                                            <col className="w-[10%]" />
                                        </colgroup>
                                        <thead>
                                            <tr className="border-b border-border bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
                                                {COLUMNS.map((col) => {
                                                    const active = sort.key === col.key;
                                                    return (
                                                        <th key={col.key} className="overflow-hidden px-2.5 py-2.5 font-medium" title={col.title}>
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleSort(col.key)}
                                                                className={cn(
                                                                    'flex w-full min-w-0 items-center gap-1 transition-colors hover:text-foreground',
                                                                    col.align === 'right' && 'flex-row-reverse',
                                                                    active && 'text-foreground',
                                                                )}
                                                            >
                                                                <span className="truncate">{col.label}</span>
                                                                {active ? (
                                                                    sort.direction === 'asc' ? (
                                                                        <ChevronUp className="size-3.5 shrink-0" />
                                                                    ) : (
                                                                        <ChevronDown className="size-3.5 shrink-0" />
                                                                    )
                                                                ) : (
                                                                    <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground/50" />
                                                                )}
                                                            </button>
                                                        </th>
                                                    );
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((row) => (
                                                <tr key={row.id} className="border-b border-border/60 last:border-0 align-top hover:bg-muted/30">
                                                    <td className="overflow-hidden px-2.5 py-2.5 whitespace-nowrap text-muted-foreground">
                                                        {fmtDate(row.expense_date)}
                                                    </td>
                                                    <td className="px-2.5 py-2.5">
                                                        <span className="flex items-start gap-1.5">
                                                            {row.is_inflow ? (
                                                                <ArrowUpCircle className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                                                            ) : (
                                                                <ArrowDownCircle className="mt-0.5 size-3.5 shrink-0 text-red-600" />
                                                            )}
                                                            <span className="text-foreground break-words whitespace-normal">
                                                                {row.description || row.category_label}
                                                            </span>
                                                        </span>
                                                    </td>
                                                    <td className="px-2.5 py-2.5 break-words whitespace-normal text-muted-foreground">
                                                        {row.category_label}
                                                    </td>
                                                    <td className="px-2.5 py-2.5 break-words whitespace-normal text-muted-foreground">
                                                        {row.vendor_name || '—'}
                                                    </td>
                                                    <td className="overflow-hidden px-2.5 py-2.5 text-right tabular-nums whitespace-nowrap text-muted-foreground">
                                                        {row.quantity != null ? fmtNumber(row.quantity) : '—'}
                                                    </td>
                                                    <td className="px-2.5 py-2.5 break-words whitespace-normal text-muted-foreground">
                                                        {row.unit || '—'}
                                                    </td>
                                                    <td className="overflow-hidden px-2.5 py-2.5 text-right tabular-nums whitespace-nowrap text-muted-foreground">
                                                        {row.unit_price != null ? fmtCurrency(row.unit_price) : '—'}
                                                    </td>
                                                    <td
                                                        className={cn(
                                                            'overflow-hidden px-2.5 py-2.5 text-right font-medium tabular-nums whitespace-nowrap',
                                                            row.is_inflow ? 'text-emerald-600' : 'text-red-600',
                                                        )}
                                                    >
                                                        {row.is_inflow ? '+' : '−'}
                                                        {fmtCurrency(row.absolute_amount)}
                                                    </td>
                                                    <td className="overflow-hidden px-2.5 py-2.5 text-right font-semibold tabular-nums whitespace-nowrap text-foreground">
                                                        {fmtCurrency(row.running_balance)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {rows.length === 0 && (
                                                <tr>
                                                    <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-sm text-muted-foreground">
                                                        {search.trim() !== ''
                                                            ? <>Tidak ada transaksi yang cocok dengan pencarian &quot;{search}&quot;.</>
                                                            : 'Tidak ada transaksi untuk kategori ini.'}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
