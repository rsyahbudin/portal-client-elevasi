import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        pin: '',
        name: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <>
            <Head title="Masuk" />

            <form onSubmit={submit} className="flex flex-col gap-6">
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="pin">PIN proyek/kawasan</Label>
                        <Input
                            id="pin"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="off"
                            placeholder="6 digit"
                            className="text-center font-mono text-2xl tracking-[0.4em]"
                            value={data.pin}
                            onChange={(e) => setData('pin', e.target.value.replace(/\D/g, '').slice(0, 6))}
                        />
                        <InputError message={errors.pin} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="name">Nama Anda</Label>
                        <Input
                            id="name"
                            type="text"
                            required
                            tabIndex={2}
                            autoComplete="name"
                            placeholder="Nama lengkap"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <InputError message={errors.name} />
                        <p className="text-xs text-muted-foreground">Dicatat supaya Elevasi tahu siapa yang sedang memantau.</p>
                    </div>

                    <Button type="submit" className="mt-4 w-full" tabIndex={3} disabled={processing} data-test="login-button">
                        {processing && <Spinner />}
                        Masuk
                    </Button>
                </div>
            </form>
        </>
    );
}

Login.layout = {
    title: 'Portal Client Elevasi Design Build',
    description: 'Masukkan PIN proyek atau kawasan yang diberikan tim Elevasi untuk memantau progres, laporan harian, dan foto lapangan.',
};
