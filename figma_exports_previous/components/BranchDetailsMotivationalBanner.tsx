import { Heart, Sparkles } from "lucide-react"

export function BranchDetailsMotivationalBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-medium mb-1">Every detail matters when building safe homes.</h2>
            <p className="text-blue-100 text-sm">Comprehensive branch management for quality care</p>
          </div>
        </div>
        <Sparkles className="h-8 w-8 text-white/60" />
      </div>
    </div>
  )
}