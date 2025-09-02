import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Keyboard } from 'lucide-react';

export function KeyboardShortcuts() {
  return (
    <Card className="border-0 bg-white/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-gray-600">
          <Keyboard className="h-4 w-4" />
          Keyboard Shortcuts
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Toggle completion:</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd>
          </div>
          <div className="flex justify-between">
            <span>Focus search:</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Tab</kbd>
          </div>
          <div className="flex justify-between">
            <span>Drag to reorder:</span>
            <span className="text-gray-400">Click & drag</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}