import { Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function MotivationalBanner() {
  return (
    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 mb-5 lg:mb-7.5">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center size-12 rounded-full bg-green-100 dark:bg-green-900/30 shrink-0">
            <Heart className="size-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-lg text-green-900 dark:text-green-100 italic text-center">
              "Every task you complete today, helps someone feel safer tomorrow."
            </p>
            <div className="flex justify-center mt-2">
              <div className="flex gap-1.5">
                <div className="size-2 bg-purple-500 rounded-full"></div>
                <div className="size-2 bg-blue-500 rounded-full"></div>
                <div className="size-2 bg-yellow-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
