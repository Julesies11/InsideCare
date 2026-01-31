import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Users, Home, CheckCircle, XCircle } from "lucide-react"
import { Badge } from "./ui/badge"

export function BranchSummary() {
  return (
    <div className="space-y-4">
      {/* Number of Staff */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span>👥</span>
                <p className="text-sm text-muted-foreground">Number of Staff</p>
              </div>
              <p className="text-2xl font-semibold text-gray-900">15</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Number of Houses */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span>🏠</span>
                <p className="text-sm text-muted-foreground">Number of Houses</p>
              </div>
              <p className="text-2xl font-semibold text-gray-900">8</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Home className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Status */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span>✅</span>
                <p className="text-sm text-muted-foreground">Compliance Status</p>
              </div>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                Compliant
              </Badge>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Last Audit:</span>
              <span className="text-gray-900">Nov 2024</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Next Review:</span>
              <span className="text-gray-900">May 2025</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <button className="w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors">
            Export Branch Report
          </button>
          <button className="w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors">
            Schedule Audit
          </button>
          <button className="w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors">
            Update Details
          </button>
          <button className="w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors">
            View History
          </button>
        </CardContent>
      </Card>
    </div>
  )
}