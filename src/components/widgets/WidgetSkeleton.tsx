export default function WidgetSkeleton({ className }: { className?: string }) {
    return (
        <div
            className={`w-full h-full bg-card animate-pulse rounded-2xl ${className || ""
                }`}
        />
    );
}
