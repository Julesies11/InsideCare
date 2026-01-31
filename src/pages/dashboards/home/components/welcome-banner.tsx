import { Heart, Sparkles } from 'lucide-react';

export function WelcomeBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Heart className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-medium mb-1">Welcome to InsideCare</h2>
            <p className="text-blue-100 text-sm">Making a difference, one step at a time</p>
          </div>
        </div>
        <Sparkles className="size-8 text-white/60" />
      </div>
    </div>
  );
}
