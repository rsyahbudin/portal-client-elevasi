import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

const PIN_LENGTH = 6;

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
                <div className="grid gap-2">
                    <Label htmlFor="pin">PIN proyek/kawasan</Label>
                    {/*
                        Enam kotak terpisah, bukan satu kolom teks — PIN dibagikan
                        lisan/lewat chat ke pengawas di lapangan, dan digit yang
                        terpisah jauh lebih mudah dicocokkan sambil membaca.
                    */}
                    <InputOTP
                        id="pin"
                        maxLength={PIN_LENGTH}
                        value={data.pin}
                        onChange={(value) =>
                            setData('pin', value.replace(/\D/g, ''))
                        }
                        inputMode="numeric"
                        autoFocus
                        containerClassName="w-full"
                        aria-describedby={errors.pin ? 'pin-error' : undefined}
                    >
                        <InputOTPGroup className="grid w-full grid-cols-6 gap-2">
                            {Array.from({ length: PIN_LENGTH }, (_, i) => (
                                <InputOTPSlot key={i} index={i} />
                            ))}
                        </InputOTPGroup>
                    </InputOTP>
                    <InputError id="pin-error" message={errors.pin} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="name">Nama Anda</Label>
                    <Input
                        id="name"
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="Nama lengkap"
                        className="h-11 bg-card"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                    />
                    <InputError message={errors.name} />
                    <p className="text-xs text-muted-foreground">
                        Dicatat supaya Elevasi tahu siapa yang sedang memantau.
                    </p>
                </div>

                <Button
                    type="submit"
                    size="lg"
                    className="w-full shadow-sm"
                    disabled={processing || data.pin.length < PIN_LENGTH}
                    data-test="login-button"
                >
                    {processing && <Spinner />}
                    Masuk
                </Button>
            </form>
        </>
    );
}

Login.layout = {
    title: 'Portal Client Elevasi Design Build',
    description:
        'Masukkan PIN proyek atau kawasan yang diberikan tim Elevasi untuk memantau progres, laporan harian, dan foto lapangan.',
};
