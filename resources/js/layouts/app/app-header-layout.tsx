import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { PortalHeader } from '@/components/portal-header';
import type { AppLayoutProps } from '@/types';

export default function AppHeaderLayout({ children }: AppLayoutProps) {
    return (
        <AppShell>
            <PortalHeader />
            <AppContent>{children}</AppContent>
        </AppShell>
    );
}
