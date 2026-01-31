import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { UserPlus, Users, AlertCircle, Plus } from "lucide-react"

interface QuickActionsProps {
  onPageChange?: (page: string) => void
}

export function QuickActions({ onPageChange }: QuickActionsProps = {}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-green-600" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-3 gap-3">
          <Button 
            className="h-auto p-4 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm"
            onClick={() => onPageChange?.('participant-profiles')}
          >
            <div className="flex flex-col items-center gap-2">
              <UserPlus className="h-6 w-6" />
              <span>Add Client</span>
            </div>
          </Button>
          
          <Button 
            className="h-auto p-4 bg-green-600 hover:bg-green-700 text-white border-0 shadow-sm"
            onClick={() => onPageChange?.('staff-profiles')}
          >
            <div className="flex flex-col items-center gap-2">
              <Users className="h-6 w-6" />
              <span>Add Staff</span>
            </div>
          </Button>
          
          <Button 
            className="h-auto p-4 bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-sm"
            onClick={() => onPageChange?.('incident-reports')}
          >
            <div className="flex flex-col items-center gap-2">
              <AlertCircle className="h-6 w-6" />
              <span>Log Incident</span>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}