import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

/** "2026-07-05" -> "5 Juli 2026". Aman dipanggil dengan string kosong/null. */
export function formatDateID(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

/** "2026-07-05" -> { day: "5", month: "Jul" }. Untuk chip tanggal ringkas. */
export function formatDateChip(value: string | null | undefined): { day: string; month: string } {
    if (!value) return { day: '—', month: '' };
    const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
    if (Number.isNaN(date.getTime())) return { day: '—', month: '' };
    return {
        day: new Intl.DateTimeFormat('id-ID', { day: 'numeric' }).format(date),
        month: new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(date).replace('.', ''),
    };
}

/** "2026-07" -> "Juli 2026". Untuk label pemilihan bulan. */
export function formatMonthID(value: string): string {
    const date = new Date(`${value}-01T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
}
