import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import Heading from '@/components/heading';

export default function Appearance() {
    return (
        <>
            <Head title="Pengaturan Tampilan" />

            <h1 className="sr-only">Pengaturan Tampilan</h1>

            <div className="space-y-6">
                <Heading variant="small" title="Tampilan" description="Atur mode tampilan (terang/gelap)" />
                <AppearanceTabs />
            </div>
        </>
    );
}
