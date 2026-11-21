export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={
                `block text-sm font-bold text-[#0B132B] ` +
                className
            }
        >
            {value ? value : children}
        </label>
    );
}
