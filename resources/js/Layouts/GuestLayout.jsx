import ApplicationLogo from '@/Components/ApplicationLogo';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-[#f7f8fb] px-4 pt-6 sm:justify-center sm:pt-8">
            <div className="flex w-full max-w-md items-center justify-between">
                <Link href={route('home')}>
                    <ApplicationLogo className="h-12 w-52" />
                </Link>
                <LanguageSwitcher />
            </div>

            <div className="mt-6 w-full overflow-hidden rounded-2xl border border-slate-100 bg-white px-6 py-7 shadow-xl shadow-slate-200/60 sm:max-w-md sm:px-8">
                {children}
            </div>
        </div>
    );
}
