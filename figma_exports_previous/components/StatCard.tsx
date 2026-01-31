import { Card, CardContent } from "./ui/card"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: number
  icon: LucideIcon
  color: string
  emoji: string
}

export function StatCard({ title, value, icon: Icon, color, emoji }: StatCardProps) {
  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{emoji}</span>
              <p className="text-sm text-muted-foreground">{title}</p>
            </div>
            <p className="text-3xl font-semibold text-gray-900">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}