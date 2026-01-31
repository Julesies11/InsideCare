import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Badge } from "./ui/badge"
import { Plus, Search, Filter, Download, AlertTriangle, CheckCircle, Clock, ClipboardCheck } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Alert, AlertDescription } from "./ui/alert"

export function ComplianceDirectory() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterRole, setFilterRole] = useState("all")

  const complianceModules = [
    {
      id: 1,
      name: "NDIS Orientation",
      responsibleRole: "All Staff",
      completionStatus: "85%",
      dueDate: "2024-12-31",
      status: "On Track",
      totalStaff: 20,
      completedStaff: 17,
      overdueStaff: 0
    },
    {
      id: 2,
      name: "First Aid & CPR",
      responsibleRole: "Support Workers",
      completionStatus: "90%",
      dueDate: "2024-10-15",
      status: "On Track",
      totalStaff: 15,
      completedStaff: 13,
      overdueStaff: 0
    },
    {
      id: 3,
      name: "Medication Management",
      responsibleRole: "Support Workers",
      completionStatus: "60%",
      dueDate: "2024-09-30",
      status: "Due Soon",
      totalStaff: 15,
      completedStaff: 9,
      overdueStaff: 2
    },
    {
      id: 4,
      name: "Behaviour Support",
      responsibleRole: "House Managers",
      completionStatus: "40%",
      dueDate: "2024-09-15",
      status: "Overdue",
      totalStaff: 5,
      completedStaff: 2,
      overdueStaff: 3
    },
    {
      id: 5,
      name: "Privacy & Confidentiality",
      responsibleRole: "All Staff",
      completionStatus: "95%",
      dueDate: "2024-11-30",
      status: "On Track",
      totalStaff: 20,
      completedStaff: 19,
      overdueStaff: 0
    },
    {
      id: 6,
      name: "Manual Handling",
      responsibleRole: "Support Workers",
      completionStatus: "75%",
      dueDate: "2024-10-01",
      status: "Due Soon",
      totalStaff: 15,
      completedStaff: 11,
      overdueStaff: 1
    },
    {
      id: 7,
      name: "Fire Safety",
      responsibleRole: "All Staff",
      completionStatus: "100%",
      dueDate: "2024-12-01",
      status: "Complete",
      totalStaff: 20,
      completedStaff: 20,
      overdueStaff: 0
    }
  ]

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Complete": return "default"
      case "On Track": return "secondary"
      case "Due Soon": return "outline"
      case "Overdue": return "destructive"
      default: return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Complete": return <CheckCircle className="h-4 w-4 text-green-600" />
      case "On Track": return <CheckCircle className="h-4 w-4 text-blue-600" />
      case "Due Soon": return <Clock className="h-4 w-4 text-orange-600" />
      case "Overdue": return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const filteredModules = complianceModules.filter(module => {
    const matchesSearch = module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.responsibleRole.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || module.status === filterStatus
    const matchesRole = filterRole === "all" || module.responsibleRole === filterRole
    
    return matchesSearch && matchesStatus && matchesRole
  })

  const overdueCount = complianceModules.filter(m => m.status === "Overdue").length
  const dueSoonCount = complianceModules.filter(m => m.status === "Due Soon").length
  const totalOverdueStaff = complianceModules.reduce((sum, m) => sum + m.overdueStaff, 0)

  const uniqueRoles = [...new Set(complianceModules.map(m => m.responsibleRole))]

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">Compliance Directory</h1>
          <p className="text-gray-600">Track training modules, certifications, and compliance requirements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Module
          </Button>
        </div>
      </div>

      {/* Alert Banners */}
      {(overdueCount > 0 || totalOverdueStaff > 0) && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Compliance Alert:</strong> {overdueCount} training module{overdueCount !== 1 ? 's' : ''} overdue, 
            affecting {totalOverdueStaff} staff member{totalOverdueStaff !== 1 ? 's' : ''}. Immediate action required.
          </AlertDescription>
        </Alert>
      )}

      {dueSoonCount > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <Clock className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Upcoming Deadlines:</strong> {dueSoonCount} training module{dueSoonCount !== 1 ? 's' : ''} due soon. 
            Schedule training sessions to maintain compliance.
          </AlertDescription>
        </Alert>
      )}

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <ClipboardCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-emerald-900 mb-1">Excellence Through Compliance</h3>
              <p className="text-emerald-700 text-sm">Staying compliant means delivering safe, quality care that participants and families can trust.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search compliance modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {uniqueRoles.map(role => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Complete">Complete</SelectItem>
              <SelectItem value="On Track">On Track</SelectItem>
              <SelectItem value="Due Soon">Due Soon</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-green-600">
                {complianceModules.filter(m => m.status === "Complete").length}
              </div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-blue-600">
                {complianceModules.filter(m => m.status === "On Track").length}
              </div>
              <div className="text-sm text-gray-600">On Track</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-orange-600">{dueSoonCount}</div>
              <div className="text-sm text-gray-600">Due Soon</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-red-600">{overdueCount}</div>
              <div className="text-sm text-gray-600">Overdue</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Modules ({filteredModules.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module Name</TableHead>
                <TableHead>Responsible Role</TableHead>
                <TableHead>Completion Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Overdue Staff</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModules.map((module) => (
                <TableRow key={module.id}>
                  <TableCell className="font-medium">{module.name}</TableCell>
                  <TableCell>{module.responsibleRole}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{module.completionStatus}</span>
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: module.completionStatus }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {module.completedStaff}/{module.totalStaff}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{module.dueDate}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(module.status)}
                      <Badge variant={getStatusBadgeVariant(module.status)}>
                        {module.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${module.overdueStaff > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      {module.overdueStaff} staff
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}