import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Hijau digelapkan dari #16a34a supaya lolos cek CVD (color-blind safe) vs
// merah #dc2626 — pasangan asli ΔE 5.0 (FAIL), pasangan ini ΔE 8.6 (PASS).
// Sama persis dengan warna di ERP (Laporan Belanja internal) supaya konsisten.
const INFLOW_COLOR = '#047857';
const OUTFLOW_COLOR = '#dc2626';

export interface ExpenseDailyCategory {
    category: string;
    type: string;
    total: number;
}

export interface ExpenseDailyRow {
    date: string;
    total_inflow: number;
    total_outflow: number;
    ending_balance: number;
    categories: ExpenseDailyCategory[];
}

function formatRp(value: number): string {
    return Math.round(value).toLocaleString('id-ID');
}

/** Label sumbu Y ringkas ("1,5jt", "850rb") — supaya selalu muat berapa pun besar angkanya. */
function formatRpCompact(value: number): string {
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}M`;
    if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}jt`;
    if (abs >= 1_000) return `${sign}${(abs / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })}rb`;
    return `${sign}${abs.toLocaleString('id-ID')}`;
}

function formatDateLabel(date: string): string {
    return new Date(date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function formatDateFull(date: string): string {
    return new Date(date + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

interface ChartTooltipPayloadItem {
    dataKey: string;
    value: number;
    payload: { date: string; ending_balance: number };
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: ChartTooltipPayloadItem[] }) {
    if (!active || !payload || payload.length === 0) return null;

    const date = payload[0]?.payload?.date;
    const endingBalance = payload[0]?.payload?.ending_balance ?? 0;
    const inflow = payload.find((p) => p.dataKey === 'total_inflow')?.value ?? 0;
    const outflow = payload.find((p) => p.dataKey === 'total_outflow')?.value ?? 0;

    return (
        <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
            <p className="mb-1 font-medium text-foreground">{date ? formatDateFull(date) : ''}</p>
            <p style={{ color: INFLOW_COLOR }}>Masuk: Rp {formatRp(inflow)}</p>
            <p style={{ color: OUTFLOW_COLOR }}>Keluar: Rp {formatRp(outflow)}</p>
            <p className="mt-1 border-t border-border pt-1 font-medium text-foreground">Sisa saldo: Rp {formatRp(endingBalance)}</p>
        </div>
    );
}

export function ExpenseDailyChart({ days }: { days: ExpenseDailyRow[] }) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const toggle = (date: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(date)) next.delete(date);
            else next.add(date);
            return next;
        });
    };

    if (days.length === 0) {
        return (
            <p className="py-10 text-center text-sm text-muted-foreground">
                Belum ada transaksi di rentang tanggal ini.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-3 shadow-xs sm:p-4">
                <p className="mb-3 text-sm font-semibold text-foreground">Pemasukan vs pengeluaran per hari</p>
                {/* min-width naik seiring jumlah hari — batang tidak pernah kebentur sempit,
                    dan sumbu Y ikut ter-scroll bersama (bukan cuma bar-nya) jadi selalu jelas
                    angkanya berapa, di layar sesempit apa pun. */}
                <div className="overflow-x-auto">
                    <div style={{ minWidth: Math.max(days.length * 56, 320) }}>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={days} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDateLabel}
                                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v: number) => formatRpCompact(v)}
                                    width={44}
                                />
                                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
                                <Legend formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>} />
                                <Bar dataKey="total_inflow" name="Masuk" fill={INFLOW_COLOR} radius={[3, 3, 0, 0]} maxBarSize={28} />
                                <Bar dataKey="total_outflow" name="Keluar" fill={OUTFLOW_COLOR} radius={[3, 3, 0, 0]} maxBarSize={28} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                {days
                    .slice()
                    .reverse()
                    .map((day) => {
                        const isOpen = expanded.has(day.date);
                        return (
                            <div key={day.date} className="rounded-lg border border-border bg-card">
                                <button
                                    type="button"
                                    className="flex w-full flex-col items-start gap-1.5 px-3 py-3 text-left hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4"
                                    onClick={() => toggle(day.date)}
                                >
                                    <div className="flex items-center gap-2">
                                        {isOpen ? (
                                            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                                        )}
                                        <span className="text-sm font-medium text-foreground">{formatDateFull(day.date)}</span>
                                    </div>
                                    <div className="flex w-full shrink-0 items-center justify-between gap-3 pl-5.5 text-xs tabular-nums sm:w-auto sm:justify-end sm:pl-0">
                                        <span className="flex items-center gap-3">
                                            <span style={{ color: INFLOW_COLOR }}>+{formatRp(day.total_inflow)}</span>
                                            <span style={{ color: OUTFLOW_COLOR }}>-{formatRp(day.total_outflow)}</span>
                                        </span>
                                        <span className="font-semibold text-foreground">
                                            Saldo: Rp {formatRp(day.ending_balance)}
                                        </span>
                                    </div>
                                </button>
                                {isOpen && (
                                    <div className="space-y-1.5 border-t border-border bg-muted/20 px-4 py-3">
                                        {day.categories.map((cat, i) => (
                                            <div key={`${cat.category}-${i}`} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            'text-[10px]',
                                                            cat.type === 'in' ? 'border-emerald-500/30 text-emerald-600' : 'border-red-500/30 text-red-600',
                                                        )}
                                                    >
                                                        {cat.type === 'in' ? 'Masuk' : 'Keluar'}
                                                    </Badge>
                                                    <span className="text-muted-foreground">{cat.category}</span>
                                                </div>
                                                <span className="font-medium tabular-nums">Rp {formatRp(cat.total)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
