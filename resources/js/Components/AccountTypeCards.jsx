export default function AccountTypeCards({ value, onChange, error, t }) {
    const options = [
        { value: 'business', icon: 'building' },
        { value: 'individual', icon: 'creator' },
    ];

    return <fieldset>
        <legend className="text-sm font-bold text-[#0B132B]">{t('account_type.label')}</legend>
        <p className="mt-1 text-xs leading-5 text-slate-500">{t('account_type.help')}</p>
        <div className="mt-2.5 grid auto-rows-fr gap-2.5 sm:grid-cols-2">
            {options.map((option) => <label key={option.value} className={`relative flex min-h-20 cursor-pointer items-center gap-3 rounded-xl border-2 p-3 pr-10 transition focus-within:ring-2 focus-within:ring-[#F4B942]/45 ${value === option.value ? 'border-[#F4B942] bg-amber-50/80 shadow-sm' : 'border-slate-200 bg-white hover:border-[#F4B942]/60'}`}>
                <input type="radio" name="account_type" value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} className="sr-only" required />
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${value === option.value ? 'bg-[#0B132B] text-[#FFDC7A]' : 'bg-slate-100 text-slate-500'}`}><AccountTypeIcon type={option.icon} /></span>
                <span className="min-w-0"><span className="block text-sm font-black leading-5 text-[#0B132B]">{t(`account_type.${option.value}`)}</span><span className="mt-0.5 block text-xs leading-4 text-slate-500">{t(`account_type.${option.value}_help`)}</span></span>
                {value === option.value && <span className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-[#F4B942] text-[#0B132B]" aria-hidden="true"><CheckIcon /></span>}
            </label>)}
        </div>
        {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
    </fieldset>;
}

function CheckIcon() {
    return <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 20 20"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="m5 10 3 3 7-7" /></svg>;
}

function AccountTypeIcon({ type }) {
    const path = type === 'building'
        ? 'M4 21V7l8-4 8 4v14M8 10h2m4 0h2m-8 4h2m4 0h2m-6 7v-3h4v3'
        : 'M12 13a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-8 8a8 8 0 0 1 16 0m1-12v4m2-2h-4';

    return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d={path} /></svg>;
}
