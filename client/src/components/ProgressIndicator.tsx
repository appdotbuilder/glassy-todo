import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Target } from 'lucide-react';

interface ProgressIndicatorProps {
  completed: number;
  total: number;
  className?: string;
}

export function ProgressIndicator({ completed, total, className = '' }: ProgressIndicatorProps) {
  if (total === 0) return null;
  
  const percentage = Math.round((completed / total) * 100);
  const isComplete = completed === total;

  return (
    <Card className={`border-0 bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-sm ${className}`}>
      <CardContent className="pt-4">
        <div className="flex items-center gap-3 mb-3">
          {isComplete ? (
            <Target className="h-5 w-5 text-green-500" />
          ) : (
            <TrendingUp className="h-5 w-5 text-blue-500" />
          )}
          <div className="flex-1">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-sm font-medium text-gray-700">
                {isComplete ? '🎉 All done!' : 'Shopping Progress'}
              </span>
              <span className="text-xs text-gray-500">
                {completed} of {total} completed
              </span>
            </div>
            <Progress 
              value={percentage} 
              className="h-2"
            />
          </div>
          <div className="text-lg font-bold text-gray-800">
            {percentage}%
          </div>
        </div>
        
        {isComplete && (
          <p className="text-xs text-center text-green-600 font-medium">
            Great job! Your shopping list is complete! 🛒✨
          </p>
        )}
      </CardContent>
    </Card>
  );
}