import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';

export default function SettingsLayout({ children }: PropsWithChildren) {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <Heading
                title="Pengaturan"
                description="Atur tampilan Portal Client"
            />

            <section className="max-w-xl space-y-10">{children}</section>
        </div>
    );
}
