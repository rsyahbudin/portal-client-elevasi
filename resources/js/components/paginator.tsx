import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    currentPage: number;
    lastPage: number;
    onNavigate: (page: number) => void;
}

/**
 * Paginasi sebelumnya/berikutnya. Tombol dikunci `shrink-0` dan penunjuk
 * halaman di tengah yang boleh menyusut — di layar 375px ketiganya nyaris
 * tidak muat, dan yang harus tetap utuh adalah tombolnya (target sentuh),
 * bukan tulisan "Halaman 1 dari 5".
 */
export function Paginator({ currentPage, lastPage, onNavigate }: Props) {
    if (lastPage <= 1) {
        return null;
    }

    return (
        <nav className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                disabled={currentPage <= 1}
                onClick={() => onNavigate(currentPage - 1)}
            >
                <ChevronLeft className="mr-1 size-3.5" />
                Sebelumnya
            </Button>
            <span className="truncate text-xs text-muted-foreground tabular-nums">
                Halaman {currentPage} dari {lastPage}
            </span>
            <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                disabled={currentPage >= lastPage}
                onClick={() => onNavigate(currentPage + 1)}
            >
                Berikutnya
                <ChevronRight className="ml-1 size-3.5" />
            </Button>
        </nav>
    );
}
