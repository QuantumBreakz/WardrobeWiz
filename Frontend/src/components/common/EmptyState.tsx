import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}: EmptyStateProps) => {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        {icon && <div className="mb-4 text-white/50">{icon}</div>}
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-white/50 mb-4 max-w-sm">{description}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction}>{actionLabel}</Button>
        )}
      </CardContent>
    </Card>
  );
};

