interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
}

export const Skeleton = ({ className = '', variant = 'rect' }: SkeletonProps) => {
  const baseClass = "bg-muted/50 animate-pulse " + (variant === 'circle' ? 'rounded-full ' : 'rounded-lg ');
  
  return (
    <div className={`${baseClass} ${className}`} />
  );
};

export const CardSkeleton = () => (
  <div className="p-6 border border-border rounded-xl space-y-4">
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
  </div>
);
