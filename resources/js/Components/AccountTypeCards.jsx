export default function AccountTypeCards({ value, onChange, error, t }) {
    const options = [
        { value: 'business', icon: 'building' },
        { value: 'individual', icon: 'creator' },
    ];

    return <fieldset>
        <legend className="text-sm font-bold text-[#0B132B]">{t('account_type.label')}</legend>
        <p className="mt-1 text-xs leading-5 text-slate-500">{t('account_type.help')}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {options.map((option) => <label key={option.value} className={`interactive-card relative flex cursor-pointer gap-3 rounded-2xl border-2 p-4 ${value === option.value ? 'border-[#F4B942] bg-amber-50/70 shadow-sm' : 'border-slate-200 bg-white hover:border-[#F4B942]/60'}`}>
                <input type="radio" name="account_type" value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} className="sr-only" required />
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${value === option.value ? 'bg-[#0B132B] text-[#FFDC7A]' : 'bg-slate-100 text-slate-500'}`}><AccountTypeIcon type={option.icon} /></span>
                <span><span className="block text-sm font-black text-[#0B132B]">{t(`account_type.${option.value}`)}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{t(`account_type.${option.value}_help`)}</span></span>
                {value === option.value && <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#F4B942]" aria-hidden="true" />}
            </label>)}
        </div>
        {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
    </fieldset>;
}

function AccountTypeIcon({ type }) {
    const path = type === 'building'
        ? 'M4 21V7l8-4 8 4v14M8 10h2m4 0h2m-8 4h2m4 0h2m-6 7v-3h4v3'
        : 'M12 13a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-8 8a8 8 0 0 1 16 0m1-12v4m2-2h-4';

    return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d={path} /></svg>;
}
