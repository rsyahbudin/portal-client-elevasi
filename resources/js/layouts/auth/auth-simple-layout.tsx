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
            <div className="hidden flex-col justify-between bg-[oklch(0.15_0_0)] p-12 text-[oklch(0.97_0_0)] lg:flex">
                <Link href="/">
                    <img src="/images/logo-elevasi-white.png" alt="Elevasi Design & Build" className="h-8 w-auto" />
                </Link>

                <p className="max-w-md font-serif text-4xl leading-[1.15] font-semibold tracking-tight text-balance">
                    Setiap tahap proyek Anda, terlihat jelas dari mana saja.
                </p>

                <ol className="flex flex-col gap-3 border-t border-white/15 pt-6 text-sm">
                    {STAGES.map((stage, i) => (
                        <li key={stage} className="flex items-baseline gap-3 text-white/70">
                            <span className="font-mono text-xs text-white/40">0{i + 1}</span>
                            {stage}
                        </li>
                    ))}
                </ol>
            </div>

            <div className="flex flex-col items-center justify-center gap-8 p-6 sm:p-10">
                <div className="w-full max-w-sm">
                    <div className="mb-8 flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
                        <Link href="/" className="lg:hidden">
                            <img src="/images/logo-elevasi.png" alt="Elevasi Design & Build" className="h-9 w-auto dark:hidden" />
                            <img
                                src="/images/logo-elevasi-white.png"
                                alt="Elevasi Design & Build"
                                className="hidden h-9 w-auto dark:block"
                            />
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-1.5">
                            <h1 className="font-serif text-2xl font-semibold tracking-tight">{title}</h1>
                            <p className="text-sm text-balance text-muted-foreground">{description}</p>
                        </div>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
