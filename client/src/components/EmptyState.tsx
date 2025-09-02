import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  className?: string;
}

export function EmptyState({ 
  icon = '🛍️', 
  title, 
  description, 
  className = '' 
}: EmptyStateProps) {
  return (
    <Card className={`shadow-lg border-0 bg-white/80 backdrop-blur-sm ${className}`}>
      <CardContent className="text-center py-12">
        <div className="mb-4 text-6xl" role="img" aria-label="Empty state icon">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
        <p className="text-gray-500">{description}</p>
      </CardContent>
    </Card>
  );
}