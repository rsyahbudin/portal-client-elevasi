import { Link } from '@inertiajs/react';
import type { AuthLayoutProps } from '@/types';

const STAGES = ['Survey', 'Desain', 'Pelaksanaan', 'Serah Terima'];

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            {/*
                Panel kiri murni dekoratif dan disembunyikan di bawah `lg` —
                di ponsel seluruh layar diberikan ke formulir, karena mayoritas
                klien membuka portal ini dari HP.
            */}
            <div className="relative hidden flex-col justify-between overflow-hidden bg-[oklch(0.21_0.042_162)] p-12 text-white lg:flex">
                <div
                    className="pointer-events-none absolute -top-32 -right-24 size-96 rounded-full bg-[oklch(0.6_0.13_160)] opacity-20 blur-3xl"
                    aria-hidden
                />

                <Link href="/" className="relative">
                    <img
                        src="/images/logo-elevasi-white.png"
                        alt="Elevasi Design & Build"
                        className="h-8 w-auto"
                    />
                </Link>

                <p className="relative max-w-md font-serif text-4xl leading-[1.15] font-semibold tracking-tight text-balance">
                    Setiap tahap proyek Anda, terlihat jelas dari mana saja.
                </p>

                <ol className="relative flex flex-col gap-3 border-t border-white/15 pt-6 text-sm">
                    {STAGES.map((stage, i) => (
                        <li
                            key={stage}
                            className="flex items-baseline gap-3 text-white/70"
                        >
                            <span className="font-mono text-xs text-white/40 tabular-nums">
                                {String(i + 1).padStart(2, '0')}
                            </span>
                            {stage}
                        </li>
                    ))}
                </ol>
            </div>

            <div className="flex flex-col items-center justify-center gap-8 p-6 sm:p-10">
                <div className="w-full max-w-sm">
                    <div className="mb-8 flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
                        <Link href="/" className="lg:hidden">
                            <img
                                src="/images/logo-elevasi.png"
                                alt="Elevasi Design & Build"
                                className="h-9 w-auto dark:hidden"
                            />
                            <img
                                src="/images/logo-elevasi-white.png"
                                alt="Elevasi Design & Build"
                                className="hidden h-9 w-auto dark:block"
                            />
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-2">
                            <h1 className="font-serif text-2xl font-semibold tracking-tight text-balance">
                                {title}
                            </h1>
                            <p className="text-sm text-balance text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
