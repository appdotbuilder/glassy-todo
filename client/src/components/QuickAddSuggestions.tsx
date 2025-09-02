import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import type { CreateShoppingListItemInput } from '../../../server/src/schema';

interface QuickAddSuggestionsProps {
  onAddItem: (input: CreateShoppingListItemInput) => Promise<void>;
  isLoading: boolean;
  userId: number;
}

const SAMPLE_ITEMS = [
  { name: '🥛 Milk', quantity: 1 },
  { name: '🍞 Bread', quantity: 2 },
  { name: '🥕 Carrots', quantity: 1 },
  { name: '🍎 Apples', quantity: 6 },
  { name: '🧀 Cheese', quantity: 1 },
  { name: '🍌 Bananas', quantity: 3 }
];

export function QuickAddSuggestions({ onAddItem, isLoading, userId }: QuickAddSuggestionsProps) {
  const handleQuickAdd = async (item: typeof SAMPLE_ITEMS[0]) => {
    await onAddItem({
      user_id: userId,
      name: item.name,
      quantity: item.quantity
    });
  };

  return (
    <Card className="border-0 bg-white/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-gray-600">
          <Plus className="h-4 w-4" />
          Quick Add (Demo Items)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {SAMPLE_ITEMS.map((item, index) => (
            <Button
              key={index}
              onClick={() => handleQuickAdd(item)}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="text-xs h-7 px-2 bg-white/80 hover:bg-white border-gray-300 hover:border-blue-400"
            >
              {item.name}
              {item.quantity > 1 && (
                <span className="ml-1 text-xs text-gray-500">×{item.quantity}</span>
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}