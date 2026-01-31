import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Badge } from "./ui/badge"
import { Plus, Search, Filter, Download, AlertTriangle, Eye, Edit, TrendingUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface IncidentReportsProps {
  onPageChange?: (page: string) => void
}

export function IncidentReports({ onPageChange }: IncidentReportsProps = {}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const incidents = [
    {
      id: 1,
      date: "2024-09-20",
      type: "Medical",
      involved: "Sarah M. (Resident)",
      description: "Minor fall in bathroom, no injuries reported",
      status: "Resolved",
      priority: "Medium",
      reportedBy: "Jane Smith",
      followUpRequired: false
    },
    {
      id: 2,
      date: "2024-09-18",
      type: "Behavioural",
      involved: "Mike D. (Resident)",
      description: "Aggressive behaviour during meal time",
      status: "Under Review",
      priority: "High",
      reportedBy: "Tom Wilson",
      followUpRequired: true
    },
    {
      id: 3,
      date: "2024-09-15",
      type: "Medication Error",
      involved: "Lisa K. (Resident)",
      description: "Medication given 2 hours late due to staff oversight",
      status: "Action Needed",
      priority: "High",
      reportedBy: "Emma Davis",
      followUpRequired: true
    },
    {
      id: 4,
      date: "2024-09-12",
      type: "Property Damage",
      involved: "Alex R. (Resident)",
      description: "Bathroom mirror cracked during episode",
      status: "Resolved",
      priority: "Low",
      reportedBy: "Michael Chen",
      followUpRequired: false
    },
    {
      id: 5,
      date: "2024-09-10",
      type: "Restrictive Practice",
      involved: "Sam T. (Resident)",
      description: "Physical restraint used to prevent self-harm",
      status: "Under Review",
      priority: "Critical",
      reportedBy: "Sarah Johnson",
      followUpRequired: true
    },
    {
      id: 6,
      date: "2024-09-08",
      type: "Staff Injury",
      involved: "Rachel P. (Staff)",
      description: "Back strain while assisting with transfer",
      status: "Resolved",
      priority: "Medium",
      reportedBy: "David Wilson",
      followUpRequired: false
    }
  ]

  const monthlyData = [
    { month: "Jun", count: 8 },
    { month: "Jul", count: 12 },
    { month: "Aug", count: 15 },
    { month: "Sep", count: 6 }
  ]

  const typeDistribution = [
    { type: "Medical", count: 12, color: "#3B82F6" },
    { type: "Behavioural", count: 8, color: "#EF4444" },
    { type: "Medication Error", count: 6, color: "#F59E0B" },
    { type: "Property Damage", count: 4, color: "#10B981" },
    { type: "Restrictive Practice", count: 3, color: "#8B5CF6" },
    { type: "Staff Injury", count: 2, color: "#F97316" }
  ]

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Resolved": return "default"
      case "Under Review": return "outline"
      case "Action Needed": return "destructive"
      default: return "secondary"
    }
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "Critical": return "destructive"
      case "High": return "default"
      case "Medium": return "secondary"
      case "Low": return "outline"
      default: return "secondary"
    }
  }

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.involved.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || incident.type === filterType
    const matchesStatus = filterStatus === "all" || incident.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  const totalIncidents = incidents.length
  const followUpsCompleted = incidents.filter(i => i.status === "Resolved").length
  const actionNeeded = incidents.filter(i => i.status === "Action Needed").length
  const restrictivePractices = incidents.filter(i => i.type === "Restrictive Practice").length

  const uniqueTypes = [...new Set(incidents.map(i => i.type))]

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">Incident Reports</h1>
          <p className="text-gray-600">Track, analyze, and manage incident reports and follow-up actions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onPageChange?.('export-hub')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => onPageChange?.('form-builder')}>
            <Plus className="h-4 w-4 mr-2" />
            Log Incident
          </Button>
        </div>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-red-900 mb-1">Learning from Every Experience</h3>
              <p className="text-red-700 text-sm">Proper incident reporting helps us improve safety and provide better support for everyone.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-blue-600">{totalIncidents}</div>
              <div className="text-sm text-gray-600">Total Incidents</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-green-600">{followUpsCompleted}</div>
              <div className="text-sm text-gray-600">Follow-Ups Completed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-red-600">{actionNeeded}</div>
              <div className="text-sm text-gray-600">Action Needed</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-purple-600">{restrictivePractices}</div>
              <div className="text-sm text-gray-600">Restrictive Practices</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Incident Distribution by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ type, count }) => `${type}: ${count}`}
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search incidents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Under Review">Under Review</SelectItem>
              <SelectItem value="Action Needed">Action Needed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Incident Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Incident Log ({filteredIncidents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Involved</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell>{incident.date}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {incident.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{incident.involved}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate">{incident.description}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityBadgeVariant(incident.priority)}>
                      {incident.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(incident.status)}>
                      {incident.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
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