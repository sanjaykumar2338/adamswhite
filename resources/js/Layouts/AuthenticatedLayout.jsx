import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { useTranslation } from '@/i18n';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const links = [
        [t('nav.dashboard'), route('dashboard'), route().current('dashboard')],
        [t('nav.activate'), route('home'), route().current('home')],
        [t('nav.team'), route('team.index'), route().current('team.*')],
    ];

    return <div className="min-h-screen bg-[#f4f6fa]">
        <nav className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-8"><Link href={route('home')}><ApplicationLogo className="h-9 w-44" /></Link><div className="hidden items-stretch gap-7 sm:flex">{links.map(([label, href, active]) => <NavLink key={label} href={href} active={active}>{label}</NavLink>)}{user.is_admin && <NavLink href={route('admin.dashboard')} active={route().current('admin.*')}>{t('nav.admin')}</NavLink>}</div></div>
                <div className="hidden items-center gap-3 sm:flex"><LanguageSwitcher /><Dropdown><Dropdown.Trigger><button type="button" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">{user.name} ▾</button></Dropdown.Trigger><Dropdown.Content><Dropdown.Link href={route('profile.edit')}>{t('nav.profile')}</Dropdown.Link><Dropdown.Link href={route('logout')} method="post" as="button">{t('nav.logout')}</Dropdown.Link></Dropdown.Content></Dropdown></div>
                <button onClick={() => setOpen(value => !value)} className="rounded-lg p-2 text-[#0b2854] sm:hidden" aria-label={t('common.menu')}><svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth="2" d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} /></svg></button>
            </div>
            {open && <div className="border-t bg-white pb-3 sm:hidden"><div className="space-y-1 py-2">{links.map(([label, href, active]) => <ResponsiveNavLink key={label} href={href} active={active}>{label}</ResponsiveNavLink>)}{user.is_admin && <ResponsiveNavLink href={route('admin.dashboard')}>{t('nav.admin')}</ResponsiveNavLink>}</div><div className="flex items-center justify-between border-t px-4 pt-3"><LanguageSwitcher /><div className="flex gap-4 text-sm"><Link href={route('profile.edit')}>{t('nav.profile')}</Link><Link href={route('logout')} method="post" as="button">{t('nav.logout')}</Link></div></div></div>}
        </nav>
        {header && <header className="border-b bg-white"><div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">{header}</div></header>}
        <main>{children}</main>
    </div>;
}
