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
                'inline-flex items-center rounded-[10px] px-3.5 py-2 text-sm font-semibold leading-5 transition duration-150 ease-in-out focus:outline-none ' +
                (active
                    ? 'bg-[#0B1120] text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-[#0B1120]') +
                className
            }
        >
            {children}
        </Link>
    );
}
