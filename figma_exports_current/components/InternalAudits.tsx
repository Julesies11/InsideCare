import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Badge } from "./ui/badge"
import { Plus, Search, Filter, Download, AlertTriangle, CheckCircle, Clock, FileSearch } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

export function InternalAudits() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterFrequency, setFilterFrequency] = useState("all")

  const audits = [
    {
      id: 1,
      type: "Medication & Processes",
      responsibleRole: "House Manager",
      frequency: "Monthly",
      nextDueDate: "2024-10-15",
      status: "On Track",
      lastCompleted: "2024-09-15",
      findings: 2,
      priority: "High"
    },
    {
      id: 2,
      type: "Restrictive Practices",
      responsibleRole: "Director",
      frequency: "Quarterly",
      nextDueDate: "2024-12-01",
      status: "On Track",
      lastCompleted: "2024-09-01",
      findings: 0,
      priority: "Critical"
    },
    {
      id: 3,
      type: "Policy Review",
      responsibleRole: "Admin",
      frequency: "Annually",
      nextDueDate: "2024-11-30",
      status: "On Track",
      lastCompleted: "2023-11-30",
      findings: 5,
      priority: "Medium"
    },
    {
      id: 4,
      type: "Financial Reports",
      responsibleRole: "Finance Manager",
      frequency: "Monthly",
      nextDueDate: "2024-09-30",
      status: "Due Soon",
      lastCompleted: "2024-08-31",
      findings: 1,
      priority: "High"
    },
    {
      id: 5,
      type: "Client File Reviews",
      responsibleRole: "House Manager",
      frequency: "Quarterly",
      nextDueDate: "2024-09-25",
      status: "Due Soon",
      lastCompleted: "2024-06-25",
      findings: 3,
      priority: "High"
    },
    {
      id: 6,
      type: "Staff Training Records",
      responsibleRole: "Admin",
      frequency: "Bi-annually",
      nextDueDate: "2024-09-10",
      status: "Overdue",
      lastCompleted: "2024-03-10",
      findings: 4,
      priority: "Medium"
    },
    {
      id: 7,
      type: "Incident Analysis",
      responsibleRole: "Director",
      frequency: "Monthly",
      nextDueDate: "2024-10-01",
      status: "On Track",
      lastCompleted: "2024-09-01",
      findings: 2,
      priority: "High"
    }
  ]

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "On Track": return "default"
      case "Due Soon": return "outline"
      case "Overdue": return "destructive"
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "On Track": return <CheckCircle className="h-4 w-4 text-green-600" />
      case "Due Soon": return <Clock className="h-4 w-4 text-orange-600" />
      case "Overdue": return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const filteredAudits = audits.filter(audit => {
    const matchesSearch = audit.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         audit.responsibleRole.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || audit.status === filterStatus
    const matchesFrequency = filterFrequency === "all" || audit.frequency === filterFrequency
    
    return matchesSearch && matchesStatus && matchesFrequency
  })

  const overdueCount = audits.filter(a => a.status === "Overdue").length
  const dueSoonCount = audits.filter(a => a.status === "Due Soon").length
  const onTrackCount = audits.filter(a => a.status === "On Track").length
  const totalFindings = audits.reduce((sum, a) => sum + a.findings, 0)

  const frequencies = [...new Set(audits.map(a => a.frequency))]

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">Internal Audits</h1>
          <p className="text-gray-600">Schedule, track, and manage internal audit processes and compliance reviews</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Audit
          </Button>
        </div>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
              <FileSearch className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-teal-900 mb-1">Continuous Improvement</h3>
              <p className="text-teal-700 text-sm">Regular audits ensure we maintain the highest standards and continuously improve our services.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search audits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterFrequency} onValueChange={setFilterFrequency}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {frequencies.map(freq => (
                <SelectItem key={freq} value={freq}>{freq}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
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
              <div className="text-2xl font-medium text-green-600">{onTrackCount}</div>
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
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-blue-600">{totalFindings}</div>
              <div className="text-sm text-gray-600">Total Findings</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Schedule ({filteredAudits.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Audit Type</TableHead>
                <TableHead>Responsible Role</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Next Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Findings</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAudits.map((audit) => (
                <TableRow key={audit.id}>
                  <TableCell className="font-medium">{audit.type}</TableCell>
                  <TableCell>{audit.responsibleRole}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {audit.frequency}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{audit.nextDueDate}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(audit.status)}
                      <Badge variant={getStatusBadgeVariant(audit.status)}>
                        {audit.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${audit.findings > 0 ? 'text-orange-600 font-medium' : 'text-green-600'}`}>
                      {audit.findings} findings
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityBadgeVariant(audit.priority)}>
                      {audit.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        View
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