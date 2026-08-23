import { cn } from '@/lib/utils';

interface Props {
    /** Tahap tercapai, 1-based. `0` = belum ada tahap yang tercapai. */
    step: number;
    total: number;
    className?: string;
}

/**
 * Indikator progres bersegmen — satu ruas per tahap pipeline. Dipilih
 * ketimbang progress bar tunggal karena tahap itu diskrit (6 tahap tetap),
 * bukan persentase kontinu; ruas terpisah membuat "tahap 4 dari 6" langsung
 * terbaca tanpa perlu mengira-ngira dari panjang bar.
 *
 * `aria-hidden` karena teks di sebelahnya sudah menyampaikan hal yang sama
 * ke pembaca layar — kalau tidak, informasinya terbaca dua kali.
 */
export function StageTrack({ step, total, className }: Props) {
    return (
        <div className={cn('flex gap-1', className)} aria-hidden>
            {Array.from({ length: total }, (_, i) => (
                <span
                    key={i}
                    className={cn(
                        'h-1.5 flex-1 rounded-full transition-colors duration-300',
                        i < step ? 'bg-primary' : 'bg-muted-foreground/15',
                    )}
                />
            ))}
        </div>
    );
}
