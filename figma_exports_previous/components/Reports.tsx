import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Download, Filter, Search, BarChart3, FileText, Calendar, Users } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

interface ReportsProps {
  onPageChange?: (page: string) => void
}

export function Reports({ onPageChange }: ReportsProps = {}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterModule, setFilterModule] = useState("all")
  const [filterType, setFilterType] = useState("all")

  const reportTemplates = [
    {
      id: 1,
      name: "Incident Summary Report",
      module: "Incident Reports",
      type: "Summary",
      description: "Monthly overview of all incidents by type, severity, and outcome",
      lastGenerated: "2024-09-20",
      frequency: "Monthly",
      recipients: "Director, House Managers",
      icon: "⚠️"
    },
    {
      id: 2,
      name: "Compliance Training Status",
      module: "Compliance Directory",
      type: "Compliance",
      description: "Staff training completion rates and overdue requirements",
      lastGenerated: "2024-09-18",
      frequency: "Weekly",
      recipients: "Admin, HR Manager",
      icon: "✅"
    },
    {
      id: 3,
      name: "Support Plan Review Status",
      module: "Support Plans",
      type: "Assessment",
      description: "Participant plan review dates and goal achievement rates",
      lastGenerated: "2024-09-15",
      frequency: "Quarterly",
      recipients: "Support Coordinators, Director",
      icon: "📋"
    },
    {
      id: 4,
      name: "Internal Audit Compliance",
      module: "Internal Audits",
      type: "Compliance",
      description: "Audit schedule completion and findings summary",
      lastGenerated: "2024-09-10",
      frequency: "Monthly",
      recipients: "Director, Quality Manager",
      icon: "🔍"
    },
    {
      id: 5,
      name: "Staff Utilization Report",
      module: "Team Structure",
      type: "Operational",
      description: "Staff allocation across houses and service types",
      lastGenerated: "2024-09-12",
      frequency: "Bi-weekly",
      recipients: "House Managers, Director",
      icon: "👥"
    },
    {
      id: 6,
      name: "Service Delivery Metrics",
      module: "Service Directory",
      type: "Performance",
      description: "Service utilization rates and participant satisfaction",
      lastGenerated: "2024-09-08",
      frequency: "Monthly",
      recipients: "All Managers",
      icon: "📊"
    },
    {
      id: 7,
      name: "Provider Network Analysis",
      module: "Providers Directory",
      type: "Network",
      description: "External provider engagement and referral patterns",
      lastGenerated: "2024-09-05",
      frequency: "Quarterly",
      recipients: "Support Coordinators, Director",
      icon: "🏥"
    },
    {
      id: 8,
      name: "House Occupancy Report",
      module: "House Directory",
      type: "Operational",
      description: "Occupancy rates, capacity utilization, and vacancy trends",
      lastGenerated: "2024-09-01",
      frequency: "Monthly",
      recipients: "Operations Manager, Director",
      icon: "🏠"
    }
  ]

  const quickActions = [
    {
      id: 1,
      title: "Generate Monthly Dashboard",
      description: "Comprehensive overview of all key metrics",
      type: "Dashboard",
      estimatedTime: "5 minutes"
    },
    {
      id: 2,
      title: "Export Incident Data",
      description: "Last 30 days incident data for external reporting",
      type: "Export",
      estimatedTime: "2 minutes"
    },
    {
      id: 3,
      title: "Compliance Alert Report",
      description: "Immediate overview of overdue training and audits",
      type: "Alert",
      estimatedTime: "1 minute"
    },
    {
      id: 4,
      title: "Custom Date Range Report",
      description: "Build a custom report for specific time period",
      type: "Custom",
      estimatedTime: "10 minutes"
    }
  ]

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "Summary": return "default"
      case "Compliance": return "destructive"
      case "Assessment": return "secondary"
      case "Operational": return "outline"
      case "Performance": return "default"
      case "Network": return "secondary"
      default: return "outline"
    }
  }

  const getFrequencyBadgeVariant = (frequency: string) => {
    switch (frequency) {
      case "Weekly": return "destructive"
      case "Bi-weekly": return "default"
      case "Monthly": return "secondary"
      case "Quarterly": return "outline"
      default: return "outline"
    }
  }

  const filteredReports = reportTemplates.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesModule = filterModule === "all" || report.module === filterModule
    const matchesType = filterType === "all" || report.type === filterType
    
    return matchesSearch && matchesModule && matchesType
  })

  const uniqueModules = [...new Set(reportTemplates.map(r => r.module))]
  const uniqueTypes = [...new Set(reportTemplates.map(r => r.type))]

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate comprehensive reports across all modules and export data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onPageChange?.('export-hub')}>
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
          </Button>
          <Button size="sm" onClick={() => onPageChange?.('form-builder')}>
            <FileText className="h-4 w-4 mr-2" />
            Create Custom Report
          </Button>
        </div>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-gray-900 mb-1">Data-Driven Excellence</h3>
              <p className="text-gray-700 text-sm">Comprehensive reporting helps us understand our impact and continuously improve the quality of care we provide.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Card key={action.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <div className="text-2xl">
                  {action.type === "Dashboard" && "📊"}
                  {action.type === "Export" && "📤"}
                  {action.type === "Alert" && "🚨"}
                  {action.type === "Custom" && "⚙️"}
                </div>
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs text-gray-600">{action.description}</div>
                <Badge variant="outline" className="text-xs">
                  {action.estimatedTime}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {uniqueModules.map(module => (
                <SelectItem key={module} value={module}>{module}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Available Reports ({filteredReports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {filteredReports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-2xl">{report.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{report.name}</h3>
                        <Badge variant={getTypeBadgeVariant(report.type)} className="text-xs">
                          {report.type}
                        </Badge>
                        <Badge variant={getFrequencyBadgeVariant(report.frequency)} className="text-xs">
                          {report.frequency}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Module: {report.module}</span>
                        <span>Last Generated: {report.lastGenerated}</span>
                        <span>Recipients: {report.recipients}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      CSV
                    </Button>
                    <Button size="sm">
                      Generate
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-blue-600">{reportTemplates.length}</div>
              <div className="text-sm text-gray-600">Available Reports</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-green-600">{uniqueModules.length}</div>
              <div className="text-sm text-gray-600">Covered Modules</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-purple-600">{uniqueTypes.length}</div>
              <div className="text-sm text-gray-600">Report Types</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-orange-600">
                {reportTemplates.filter(r => r.frequency === "Weekly" || r.frequency === "Bi-weekly").length}
              </div>
              <div className="text-sm text-gray-600">Frequent Reports</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}