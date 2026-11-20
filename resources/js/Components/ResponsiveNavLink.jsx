import { Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={`mx-3 flex w-auto items-center rounded-xl px-4 py-3 ${
                active
                    ? 'bg-[#0B132B] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-[#0B132B]'
            } text-base font-semibold transition duration-150 ease-in-out focus:outline-none ${className}`}
        >
            {children}
        </Link>
    );
}
