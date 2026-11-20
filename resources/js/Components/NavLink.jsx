import { Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center rounded-xl px-3.5 py-2 text-sm font-semibold leading-5 transition duration-150 ease-in-out focus:outline-none ' +
                (active
                    ? 'bg-[#0B132B] text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-[#0B132B]') +
                className
            }
        >
            {children}
        </Link>
    );
}
