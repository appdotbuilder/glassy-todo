import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Trash2 } from 'lucide-react';
import type { ShoppingListItem } from '../../../server/src/schema';

interface ShoppingListItemProps {
  item: ShoppingListItem;
  index: number;
  isDragging: boolean;
  isDragOver: boolean;
  onToggleComplete: (item: ShoppingListItem) => void;
  onDelete: (item: ShoppingListItem) => void;
  onDragStart: (e: React.DragEvent, item: ShoppingListItem, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}

export function ShoppingListItem({
  item,
  index,
  isDragging,
  isDragOver,
  onToggleComplete,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop
}: ShoppingListItemProps) {
  const baseClasses = `
    flex items-center gap-3 p-3 rounded-lg border transition-all
    ${item.is_completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 cursor-move hover:shadow-md hover:border-blue-300'}
    ${isDragOver ? 'border-blue-500 bg-blue-50 border-2 border-dashed' : ''}
    ${isDragging ? 'opacity-50 transform rotate-1' : ''}
  `;

  if (item.is_completed) {
    return (
      <div className={baseClasses}>
        <div className="w-4 flex-shrink-0" /> {/* Spacer for grip icon */}
        
        <Checkbox
          checked={item.is_completed}
          onCheckedChange={() => onToggleComplete(item)}
          className="flex-shrink-0"
        />
        
        <div className="flex-1 min-w-0">
          <span className="text-gray-500 line-through font-medium">{item.name}</span>
        </div>
        
        <Badge variant="outline" className="flex-shrink-0 text-gray-500">
          {item.quantity}x
        </Badge>
        
        <Button
          onClick={() => onDelete(item)}
          variant="ghost"
          size="sm"
          className="text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
          aria-label={`Delete ${item.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggleComplete(item);
        }
      }}
      className={baseClasses}
      role="listitem"
      tabIndex={0}
      aria-label={`${item.name}, quantity ${item.quantity}. ${item.is_completed ? 'Completed' : 'Not completed'}. Press Enter to toggle completion.`}
    >
      <GripVertical 
        className="h-4 w-4 text-gray-400 flex-shrink-0" 
        aria-hidden="true"
      />
      
      <Checkbox
        checked={item.is_completed}
        onCheckedChange={() => onToggleComplete(item)}
        className="flex-shrink-0"
        aria-label={`Mark ${item.name} as ${item.is_completed ? 'incomplete' : 'complete'}`}
      />
      
      <div className="flex-1 min-w-0">
        <span className="text-gray-800 font-medium">{item.name}</span>
      </div>
      
      <Badge 
        className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 text-white"
        aria-label={`Quantity: ${item.quantity}`}
      >
        {item.quantity}x
      </Badge>
      
      <Button
        onClick={() => onDelete(item)}
        variant="ghost"
        size="sm"
        className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
        aria-label={`Delete ${item.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}