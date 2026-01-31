import { Alert, AlertDescription } from "./ui/alert"
import { AlertTriangle, Calendar } from "lucide-react"
import { Button } from "./ui/button"

export function AlertBanners() {
  return (
    <div className="space-y-3">
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-yellow-800">
            <strong>3 staff missing NDIS Orientation Module</strong> - Training compliance required
          </span>
          <Button variant="outline" size="sm" className="ml-4 border-yellow-300 text-yellow-700 hover:bg-yellow-100">
            View Training
          </Button>
        </AlertDescription>
      </Alert>

      <Alert className="border-yellow-200 bg-yellow-50">
        <Calendar className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-yellow-800">
            <strong>2 overdue Support Plans</strong> - Review required for client care continuity
          </span>
          <Button variant="outline" size="sm" className="ml-4 border-yellow-300 text-yellow-700 hover:bg-yellow-100">
            Update Plans
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}