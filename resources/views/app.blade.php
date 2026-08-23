<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Warna alas harus sudah benar SEBELUM app.css termuat, supaya tidak
             ada kedip putih/gelap saat load. Nilai di sini wajib sama persis
             dengan --background di resources/css/app.css. --}}
        <style>
            html {
                background-color: oklch(0.976 0.003 165);
            }

            html.dark {
                background-color: oklch(0.165 0.008 165);
            }
        </style>

        <link rel="icon" href="/images/logo-elevasi-favicon.gif" type="image/gif">
        <link rel="apple-touch-icon" href="/images/logo-elevasi-favicon.gif">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
