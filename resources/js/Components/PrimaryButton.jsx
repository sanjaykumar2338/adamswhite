export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex min-h-[46px] items-center justify-center rounded-[10px] border border-transparent bg-[#0B1120] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0B1120]/10 transition duration-150 ease-in-out hover:-translate-y-0.5 hover:bg-[#131C31] focus:bg-[#131C31] focus:outline-none focus:ring-2 focus:ring-[#E6C87A] focus:ring-offset-2 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
