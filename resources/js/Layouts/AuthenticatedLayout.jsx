import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { useTranslation } from '@/i18n';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const { auth, support } = usePage().props;
    const user = auth.user;
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const dashboardUrl = user.is_admin ? route('admin.dashboard') : route('dashboard');
    const helpUrl = user.is_admin ? route('admin.help') : route('help');
    const customerLinks = [
        { label: t('nav.overview'), href: route('dashboard'), active: route().current('dashboard'), icon: 'home' },
        { label: t('nav.my_products'), href: route('products.index'), active: route().current('products.*'), icon: 'products' },
        { label: t('nav.statistics'), href: route('statistics.index'), active: route().current('statistics.*'), icon: 'chart' },
        { label: t('nav.settings'), href: route('profile.edit'), active: route().current('profile.*') || route().current('team.*'), icon: 'settings' },
        { label: t('nav.help'), href: route('help'), active: route().current('help'), icon: 'help' },
    ];
    const adminLinks = [
        { label: t('nav.overview'), href: route('admin.dashboard'), active: route().current('admin.dashboard'), icon: 'home' },
        { label: t('admin.accounts'), href: route('admin.customers.index'), active: route().current('admin.customers.*'), icon: 'accounts' },
        { label: t('admin.managers'), href: route('admin.managers.index'), active: route().current('admin.managers.*'), icon: 'team' },
        { label: t('admin.inventory'), href: route('admin.products.index'), active: route().current('admin.products.*'), icon: 'products' },
        { label: t('admin.batches'), href: route('admin.batches.index'), active: route().current('admin.batches.*'), icon: 'batch' },
        { label: t('nav.statistics'), href: route('admin.statistics.index'), active: route().current('admin.statistics.*'), icon: 'chart' },
        { label: t('admin.activity_log'), href: route('admin.activity.index'), active: route().current('admin.activity.*'), icon: 'activity' },
        { label: t('admin.deletion_requests'), href: route('admin.deletion-requests.index'), active: route().current('admin.deletion-requests.*'), icon: 'accounts' },
        { label: t('nav.settings'), href: route('admin.settings.edit'), active: route().current('admin.settings.*'), icon: 'settings' },
    ];
    const links = user.is_admin ? adminLinks : customerLinks;

    return <div className="min-h-screen bg-[#f6f7fb] text-[#0B132B]">
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col overflow-y-auto bg-[#0B132B] text-white shadow-2xl shadow-[#0B132B]/20 lg:flex">
            <SidebarContent dashboardUrl={dashboardUrl} helpUrl={helpUrl} links={links} supportEmail={support.email} supportUrl={support.whatsappUrl} user={user} t={t} />
        </aside>

        {open && <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" className="absolute inset-0 bg-[#050b1d]/65 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label={t('common.close_menu')} />
            <aside className="relative flex h-full w-[min(20rem,88vw)] flex-col overflow-y-auto bg-[#0B132B] text-white shadow-2xl">
                <button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 z-10 rounded-xl border border-white/15 bg-white/10 p-2 text-white" aria-label={t('common.close_menu')}><CloseIcon /></button>
                <SidebarContent dashboardUrl={dashboardUrl} helpUrl={helpUrl} links={links} supportEmail={support.email} supportUrl={support.whatsappUrl} user={user} t={t} onNavigate={() => setOpen(false)} />
            </aside>
        </div>}

        <div className="min-h-screen lg:pl-72">
            <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
                <div className="flex h-[4.75rem] items-center gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8 xl:px-10">
                    <button type="button" onClick={() => setOpen(true)} className="rounded-xl border border-slate-200 bg-white p-2.5 text-[#0B132B] shadow-sm lg:hidden" aria-label={t('common.menu')}><MenuIcon /></button>
                    <Link href={dashboardUrl} className="mr-auto min-w-0 lg:hidden"><ApplicationLogo className="h-8 w-28 sm:h-9 sm:w-36" /></Link>
                    <div className="mr-auto hidden min-w-0 lg:block">{header || <><p className="text-xs font-bold uppercase tracking-[.2em] text-[#B7791F]" translate="no">SHIFTRIX TRACK</p><p className="mt-0.5 truncate text-sm font-semibold text-slate-500">{user.is_admin ? t('admin.workspace') : t('dashboard.workspace')}</p></>}</div>
                    {!user.is_admin && <WorkspaceSwitcher t={t} />}
                    <LanguageSwitcher />
                    <Dropdown>
                        <Dropdown.Trigger><button type="button" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-[#F4B942]/50"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B132B] text-sm font-black text-[#FFDC7A]">{user.name.charAt(0).toUpperCase()}</span><span className="hidden max-w-40 truncate sm:block">{user.name}</span><ChevronIcon /></button></Dropdown.Trigger>
                        <Dropdown.Content align="right">
                            {!user.is_admin && <Dropdown.Link href={route('team.index')}>{t('nav.team')}</Dropdown.Link>}
                            <Dropdown.Link href={route('profile.edit')}>{t('nav.profile')}</Dropdown.Link>
                            <Dropdown.Link href={route('logout')} method="post" as="button">{t('nav.logout')}</Dropdown.Link>
                        </Dropdown.Content>
                    </Dropdown>
                </div>
            </header>
            <main>{children}</main>
        </div>
    </div>;
}

function WorkspaceSwitcher({ t }) {
    const { auth } = usePage().props;
    if (!auth.workspaces || auth.workspaces.length < 2) return null;
    return <Dropdown><Dropdown.Trigger><button type="button" className="hidden max-w-48 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 md:flex"><span className="truncate">{auth.workspaces.find(item => item.id === auth.currentWorkspaceId)?.business_name}</span><ChevronIcon /></button></Dropdown.Trigger><Dropdown.Content align="right">{auth.workspaces.map(workspace => <Dropdown.Link key={workspace.id} href={route('workspaces.update', workspace.id)} method="post" as="button">{workspace.business_name}{workspace.id === auth.currentWorkspaceId ? ` · ${t('common.current')}` : ''}</Dropdown.Link>)}</Dropdown.Content></Dropdown>;
}

function SidebarContent({ dashboardUrl, helpUrl, links, supportEmail, supportUrl, user, t, onNavigate }) {
    return <>
        <div className="shrink-0 border-b border-white/10 px-7 py-4"><Link href={dashboardUrl} onClick={onNavigate}><ApplicationLogo className="h-10 w-48" dark /></Link>{user.is_admin && <span className="mt-2 inline-flex rounded-full bg-[#F4B942] px-3 py-1 text-[.65rem] font-black uppercase tracking-[.18em] text-[#0B132B]">{t('admin.badge')}</span>}</div>
        <div className="shrink-0 px-5 pt-4"><p className="px-3 text-[.68rem] font-bold uppercase tracking-[.24em] text-slate-500">{user.is_admin ? t('admin.console') : t('dashboard.customer_space')}</p></div>
        <nav className="mt-2 flex-1 space-y-1 px-4" aria-label={t('nav.primary')}>
            {links.map((item) => <Link key={item.label} href={item.href} onClick={onNavigate} className={`group flex items-center gap-3 rounded-r-xl border-l-[3px] px-3.5 py-2 text-sm font-semibold transition ${item.active ? 'border-[#F4B942] bg-[rgba(247,215,116,0.12)] text-[#FFDC7A]' : 'border-transparent text-slate-300 hover:bg-white/10 hover:text-white'}`}><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.active ? 'bg-white/[.06] text-[#FFDC7A]' : 'bg-white/[.06] text-slate-400 group-hover:text-[#FFDC7A]'}`}><NavIcon type={item.icon} /></span>{item.label}</Link>)}
        </nav>
        <div className="group relative m-4 shrink-0 rounded-2xl border border-white/10 bg-white/[.06] p-3 transition hover:-translate-y-0.5 hover:border-[#F4B942]/50 hover:bg-white/10 focus-within:border-[#F4B942]/70 focus-within:ring-2 focus-within:ring-[#F4B942]/40">
            <Link href={helpUrl} onClick={onNavigate} className="absolute inset-0 rounded-2xl focus:outline-none" aria-label={t('nav.open_help')} />
            <div className="pointer-events-none relative"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#FFDC7A]">{t('nav.need_help')}</p><p className="mt-1 text-xs leading-5 text-slate-300">{t('nav.support_help')}</p><span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#FFDC7A]">{t('nav.open_help')} <span aria-hidden="true">→</span></span></div>
            <a href={supportUrl || `mailto:${supportEmail}`} target={supportUrl ? '_blank' : undefined} rel={supportUrl ? 'noreferrer' : undefined} className="relative z-10 mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:border-[#F4B942]/50 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFDC7A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B132B]"><SupportIcon />{t('nav.contact_support')}</a>
        </div>
    </>;
}

function NavIcon({ type }) {
    const paths = { home: 'M3 11.5 12 4l9 7.5M5.5 10v10h13V10M9 20v-6h6v6', products: 'm12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 0v9m8-4.5-8 4.5m-8-4.5 8 4.5', chart: 'M5 20V10m7 10V4m7 16v-7', settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8-3.5 2-1-2-3-2 .5-1.5-1.5.5-2L14 3l-2 2-2-2-3 2 .5 2L6 8.5 4 8l-2 3 2 1v2l-2 1 2 3 2-.5L7.5 19 7 21l3 2 2-2 2 2 3-2-.5-2 1.5-1.5 2 .5 2-3-2-1v-2Z', help: 'M9.5 9a2.7 2.7 0 1 1 4.2 2.25c-1.1.73-1.7 1.18-1.7 2.25M12 18h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', accounts: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', team: 'M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 9v-2a6 6 0 0 0-12 0v2m14-9v6m3-3h-6', batch: 'M4 7h16M5 7l1-3h12l1 3v13H5V7Zm4 4h6', activity: 'M3 12h4l2-6 4 12 2-6h6' };
    return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d={paths[type] || paths.home} /></svg>;
}
function MenuIcon() { return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeWidth="2" d="M4 7h16M4 12h16M4 17h16" /></svg>; }
function CloseIcon() { return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeWidth="2" d="m6 6 12 12M18 6 6 18" /></svg>; }
function ChevronIcon() { return <svg className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>; }
function SupportIcon() { return <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 13a8 8 0 0 1 16 0v5a2 2 0 0 1-2 2h-2v-7h4M4 13v7h4v-7H4Z" /></svg>; }
