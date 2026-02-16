export function Spinner({ size = "md", className = "" }) {
    const sizes = {
        sm: "w-5 h-5",
        md: "w-8 h-8",
        lg: "w-12 h-12"
    };

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <div className={`${sizes[size]} border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin`} />
            <div className={`absolute inset-0 ${sizes[size]} border-2 border-transparent border-b-cyan-500/10 rounded-full animate-spin direction-reverse duration-1000`} />
        </div>
    );
}
