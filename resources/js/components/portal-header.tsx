import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import type { PortalShared } from '@/types';

export function PortalHeader() {
    const { portal } = usePage<{ portal: PortalShared }>().props;
    const getInitials = useInitials();

    const handleLogout = () => {
        router.post('/logout', {}, { onFinish: () => router.flushAll() });
    };

    return (
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                <Link
                    href="/dashboard"
                    prefetch
                    className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background focus-visible:outline-none"
                >
                    <img
                        src="/images/logo-elevasi.png"
                        alt="Elevasi Design & Build"
                        className="h-7 w-auto dark:hidden"
                    />
                    <img
                        src="/images/logo-elevasi-white.png"
                        alt="Elevasi Design & Build"
                        className="hidden h-7 w-auto dark:block"
                    />
                    <span
                        className="hidden h-5 w-px bg-border sm:block"
                        aria-hidden
                    />
                    <span className="hidden text-[10.5px] font-medium tracking-wide text-muted-foreground uppercase sm:block">
                        Portal Client
                    </span>
                </Link>

                {portal?.viewer_name && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-10 shrink-0 gap-2 rounded-full pr-3 pl-1 hover:bg-secondary"
                            >
                                <Avatar className="size-8">
                                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                        {getInitials(portal.viewer_name)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
                                    {portal.viewer_name}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="px-2 py-1.5 text-left text-sm">
                                    <p className="font-medium">
                                        {portal.viewer_name}
                                    </p>
                                    {portal.label && (
                                        <p className="truncate text-xs text-muted-foreground">
                                            {portal.label}
                                        </p>
                                    )}
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link
                                    className="block w-full cursor-pointer"
                                    href="/settings/appearance"
                                >
                                    <Settings className="mr-2" />
                                    Tampilan
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="cursor-pointer"
                                data-test="logout-button"
                            >
                                <LogOut className="mr-2" />
                                Keluar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    );
}
