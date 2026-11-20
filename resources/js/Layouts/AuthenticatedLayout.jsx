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
    const customerLinks = [
        [t('nav.dashboard'), route('dashboard'), route().current('dashboard')],
        [t('nav.activate'), route('home'), route().current('home')],
        [t('nav.team'), route('team.index'), route().current('team.*')],
    ];
    const adminLinks = [
        [t('nav.dashboard'), route('admin.dashboard'), route().current('admin.dashboard')],
        [t('admin.customers'), route('admin.customers.index'), route().current('admin.customers.*')],
        [t('admin.inventory'), route('admin.products.index'), route().current('admin.products.*')],
        [t('common.settings'), route('admin.settings.edit'), route().current('admin.settings.*')],
    ];
    const links = user.is_admin ? adminLinks : customerLinks;
    const dashboardUrl = user.is_admin ? route('admin.dashboard') : route('dashboard');

    return <div className="app-shell min-h-screen">
        <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm shadow-[#0B132B]/[.03] backdrop-blur">
            <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#F1C156] via-[#E1A339] to-[#632C10]" />
            <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex min-w-0 items-center gap-8"><Link className="shrink-0" href={dashboardUrl} aria-label={t('nav.dashboard')}><ApplicationLogo className="h-10 w-44 sm:w-48" /></Link><div className="hidden items-center gap-1 lg:flex">{links.map(([label, href, active]) => <NavLink key={label} href={href} active={active}>{label}</NavLink>)}</div></div>
                <div className="hidden items-center gap-3 lg:flex"><LanguageSwitcher /><Dropdown><Dropdown.Trigger><button type="button" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-700 hover:border-[#E1A339]/50 hover:bg-amber-50/40"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B132B] text-xs font-extrabold text-[#F1C156]">{user.name.charAt(0).toUpperCase()}</span><span className="max-w-36 truncate">{user.name}</span><svg className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg></button></Dropdown.Trigger><Dropdown.Content><Dropdown.Link href={route('profile.edit')}>{t('nav.profile')}</Dropdown.Link><Dropdown.Link href={route('logout')} method="post" as="button">{t('nav.logout')}</Dropdown.Link></Dropdown.Content></Dropdown></div>
                <button onClick={() => setOpen(value => !value)} className="rounded-xl border border-slate-200 bg-white p-2.5 text-[#0B132B] shadow-sm lg:hidden" aria-expanded={open} aria-label={t('common.menu')}><svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth="2" d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} /></svg></button>
            </div>
            {open && <div className="border-t border-slate-100 bg-white pb-4 shadow-lg lg:hidden"><div className="space-y-1 py-3">{links.map(([label, href, active]) => <ResponsiveNavLink key={label} href={href} active={active}>{label}</ResponsiveNavLink>)}</div><div className="mx-4 flex items-center justify-between border-t border-slate-100 pt-4"><LanguageSwitcher /><div className="flex gap-4 text-sm font-semibold text-slate-600"><Link href={route('profile.edit')}>{t('nav.profile')}</Link><Link href={route('logout')} method="post" as="button">{t('nav.logout')}</Link></div></div></div>}
        </nav>
        {header && <header className="border-b border-slate-200/80 bg-white/80"><div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">{header}</div></header>}
        <main>{children}</main>
    </div>;
}
