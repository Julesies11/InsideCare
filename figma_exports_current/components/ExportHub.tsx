import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { 
  Download, 
  Upload, 
  FileText, 
  Database, 
  Users, 
  Calendar, 
  BarChart3, 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileSpreadsheet,
  File,
  Archive
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

const exportOptions = [
  {
    id: "branches",
    title: "Branch Data Export",
    description: "Export all branch information, staff details, and organizational structure",
    icon: Database,
    format: ["CSV", "Excel", "PDF"],
    size: "2.4 MB",
    lastExport: "2 days ago",
    popular: true
  },
  {
    id: "participants",
    title: "Participant Profiles",
    description: "Export participant information, support plans, and progress notes",
    icon: Users,
    format: ["CSV", "Excel", "PDF"],
    size: "5.8 MB",
    lastExport: "1 week ago",
    popular: true
  },
  {
    id: "compliance",
    title: "Compliance Reports",
    description: "Export audit reports, incident reports, and compliance documentation",
    icon: Shield,
    format: ["PDF", "Excel"],
    size: "8.2 MB",
    lastExport: "Yesterday",
    popular: false
  },
  {
    id: "financial",
    title: "Financial Data",
    description: "Export funding information, invoices, and financial reports",
    icon: BarChart3,
    format: ["Excel", "CSV"],
    size: "3.1 MB",
    lastExport: "3 days ago",
    popular: true
  },
  {
    id: "roster",
    title: "Roster & Scheduling",
    description: "Export staff rosters, schedules, and time tracking data",
    icon: Calendar,
    format: ["CSV", "Excel", "PDF"],
    size: "1.9 MB",
    lastExport: "5 days ago",
    popular: false
  },
  {
    id: "forms",
    title: "Forms & Documents",
    description: "Export custom forms, templates, and document libraries",
    icon: FileText,
    format: ["ZIP", "PDF"],
    size: "12.3 MB",
    lastExport: "1 month ago",
    popular: false
  }
]

const recentExports = [
  { name: "Monthly_Compliance_Report.pdf", date: "2 hours ago", size: "4.2 MB", status: "completed" },
  { name: "Participant_Data_Export.xlsx", date: "Yesterday", size: "5.8 MB", status: "completed" },
  { name: "Branch_Summary_Q3.csv", date: "2 days ago", size: "890 KB", status: "completed" },
  { name: "Staff_Roster_September.pdf", date: "3 days ago", size: "2.1 MB", status: "failed" }
]

export function ExportHub() {
  const [selectedFormat, setSelectedFormat] = useState<string>("")
  const [exportProgress, setExportProgress] = useState<{ [key: string]: number }>({})
  const [exportingItems, setExportingItems] = useState<string[]>([])

  const startExport = (exportId: string, format: string) => {
    setExportingItems(prev => [...prev, exportId])
    setExportProgress(prev => ({ ...prev, [exportId]: 0 }))
    
    // Simulate export progress
    const interval = setInterval(() => {
      setExportProgress(prev => {
        const currentProgress = prev[exportId] || 0
        const newProgress = currentProgress + Math.random() * 20
        
        if (newProgress >= 100) {
          clearInterval(interval)
          setExportingItems(current => current.filter(id => id !== exportId))
          return { ...prev, [exportId]: 100 }
        }
        
        return { ...prev, [exportId]: newProgress }
      })
    }, 500)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case "excel":
      case "xlsx":
        return <FileSpreadsheet className="h-4 w-4 text-green-600" />
      case "pdf":
        return <File className="h-4 w-4 text-red-600" />
      case "zip":
        return <Archive className="h-4 w-4 text-blue-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1>Export & Import Hub</h1>
          <p className="text-muted-foreground">Export data, reports, and import external files</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Data
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Bulk Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Download className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <h3 className="text-blue-900">Total Exports</h3>
            <p className="text-2xl font-bold text-blue-800">156</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Database className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <h3 className="text-green-900">Data Size</h3>
            <p className="text-2xl font-bold text-green-800">45.2 GB</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-orange-500 mb-2" />
            <h3 className="text-orange-900">Last Export</h3>
            <p className="text-2xl font-bold text-orange-800">2h ago</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <h3 className="text-purple-900">Success Rate</h3>
            <p className="text-2xl font-bold text-purple-800">98.4%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Options */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Exports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {exportOptions.map((option) => {
                const Icon = option.icon
                const isExporting = exportingItems.includes(option.id)
                const progress = exportProgress[option.id] || 0
                
                return (
                  <div key={option.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{option.title}</h4>
                            {option.popular && (
                              <Badge variant="secondary" className="text-xs">Popular</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{option.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Size: {option.size}</span>
                            <span>Last: {option.lastExport}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {isExporting ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Exporting...</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Format" />
                          </SelectTrigger>
                          <SelectContent>
                            {option.format.map((format) => (
                              <SelectItem key={format} value={format}>
                                <div className="flex items-center gap-2">
                                  {getFormatIcon(format)}
                                  {format}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          size="sm" 
                          onClick={() => startExport(option.id, selectedFormat)}
                          disabled={!selectedFormat}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Recent Exports & Import Options */}
        <div className="space-y-6">
          {/* Recent Exports */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Exports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentExports.map((exportItem, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(exportItem.status)}
                    <div>
                      <p className="font-medium text-sm">{exportItem.name}</p>
                      <p className="text-xs text-muted-foreground">{exportItem.date} • {exportItem.size}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Import Options */}
          <Card>
            <CardHeader>
              <CardTitle>Import Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="font-medium mb-2">Drag & Drop Files</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Support for CSV, Excel, and JSON files
                </p>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Quick Import Templates</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Staff Template
                  </Button>
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Participant Template
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Roster Template
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Form Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}