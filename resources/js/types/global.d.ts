import type { PortalShared } from '@/types/auth';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            portal: PortalShared;
            [key: string]: unknown;
        };
    }
}
