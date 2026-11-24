import TextInput from '@/Components/TextInput';
import { useState } from 'react';

export default function PasswordInput({ id, className = '', t, ...props }) {
    const [visible, setVisible] = useState(false);
    const label = visible ? t('auth.hide_password') : t('auth.show_password');

    return <div className="relative">
        <TextInput {...props} id={id} name={id} type={visible ? 'text' : 'password'} className={`w-full pr-12 ${className}`} />
        <button type="button" onClick={() => setVisible((current) => !current)} aria-label={label} aria-pressed={visible} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 hover:text-[#0B132B] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F4B942]">
            {visible ? <EyeSlashIcon /> : <EyeIcon />}
        </button>
    </div>;
}

function EyeIcon() {
    return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.7" strokeWidth="1.8" /></svg>;
}

function EyeSlashIcon() {
    return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m4 4 16 16M10.6 6.1A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-2.2 2.8M6.2 6.3C3.8 8 2.5 12 2.5 12s3.5 6 9.5 6c1.2 0 2.3-.2 3.3-.6M9.9 9.8a3 3 0 0 0 4.2 4.3" /></svg>;
}
