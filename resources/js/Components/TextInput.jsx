import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, ...props },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={
                'rounded-xl border-slate-300 px-4 py-3 text-[#0B132B] shadow-sm placeholder:text-slate-400 hover:border-slate-400 focus:border-[#F4B942] focus:ring-[#F4B942]/30 ' +
                className
            }
            ref={localRef}
        />
    );
});
