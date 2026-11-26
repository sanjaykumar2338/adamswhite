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
                'min-h-[46px] rounded-[10px] border-slate-300 px-4 py-2.5 text-[#0B1120] shadow-sm placeholder:text-slate-400 hover:border-slate-400 focus:border-[#E6C87A] focus:ring-[#E6C87A]/30 ' +
                className
            }
            ref={localRef}
        />
    );
});
