import * as React from 'react';

type Props = React.ComponentProps<'main'>;

export function AppContent({ children, ...props }: Props) {
    return (
        <main
            className="mx-auto flex h-full w-full max-w-6xl flex-1 flex-col gap-4"
            {...props}
        >
            {children}
        </main>
    );
}
