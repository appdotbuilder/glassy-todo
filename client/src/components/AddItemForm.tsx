import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import type { CreateShoppingListItemInput } from '../../../server/src/schema';

interface AddItemFormProps {
  onAddItem: (input: CreateShoppingListItemInput) => Promise<void>;
  isLoading: boolean;
  userId: number;
}

export function AddItemForm({ onAddItem, isLoading, userId }: AddItemFormProps) {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    await onAddItem({
      user_id: userId,
      name: itemName.trim(),
      quantity: quantity
    });

    // Reset form
    setItemName('');
    setQuantity(1);
  };

  return (
    <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-gray-800">
          <div className="p-1 bg-green-500 rounded-full">
            <Plus className="h-4 w-4 text-white" />
          </div>
          Add New Item
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="item-name" className="text-sm font-medium text-gray-700">
                Item Name
              </Label>
              <Input
                id="item-name"
                placeholder="What do you need to buy? 🥕"
                value={itemName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItemName(e.target.value)}
                className="text-base focus-enhanced"
                required
                disabled={isLoading}
              />
            </div>
            <div className="w-24 space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                Qty
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="999"
                value={quantity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="text-center text-base focus-enhanced"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading || !itemName.trim()}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium py-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Adding...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add to List
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}