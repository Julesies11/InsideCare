import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Calendar } from "./ui/calendar"
import { Textarea } from "./ui/textarea"
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  MapPin, 
  Bell, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  Search,
  Filter,
  MoreHorizontal
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Label } from "./ui/label"

const auditTypes = [
  { id: "compliance", name: "Compliance Audit", duration: "4 hours", frequency: "Quarterly" },
  { id: "financial", name: "Financial Audit", duration: "6 hours", frequency: "Annually" },
  { id: "safety", name: "Safety Inspection", duration: "2 hours", frequency: "Monthly" },
  { id: "quality", name: "Quality Review", duration: "3 hours", frequency: "Bi-annually" },
  { id: "documentation", name: "Documentation Review", duration: "2 hours", frequency: "Monthly" },
  { id: "medication", name: "Medication Audit", duration: "1.5 hours", frequency: "Weekly" }
]

const scheduledAudits = [
  {
    id: 1,
    type: "Compliance Audit",
    date: "2024-10-15",
    time: "09:00",
    location: "Sunshine House",
    auditor: "Sarah Wilson",
    status: "scheduled",
    priority: "high",
    notes: "Annual compliance review focusing on NDIS standards"
  },
  {
    id: 2,
    type: "Safety Inspection",
    date: "2024-10-18",
    time: "14:00",
    location: "Ocean View",
    auditor: "Mark Thompson",
    status: "pending",
    priority: "medium",
    notes: "Monthly safety walkthrough and equipment check"
  },
  {
    id: 3,
    type: "Medication Audit",
    date: "2024-10-20",
    time: "10:30",
    location: "Garden Villa",
    auditor: "Jennifer Adams",
    status: "confirmed",
    priority: "high",
    notes: "Weekly medication administration review"
  },
  {
    id: 4,
    type: "Quality Review",
    date: "2024-10-25",
    time: "11:00",
    location: "Central Office",
    auditor: "David Martinez",
    status: "draft",
    priority: "low",
    notes: "Bi-annual service quality assessment"
  }
]

const auditors = [
  { id: "sarah", name: "Sarah Wilson", role: "Senior Auditor", availability: "available" },
  { id: "mark", name: "Mark Thompson", role: "Safety Inspector", availability: "busy" },
  { id: "jennifer", name: "Jennifer Adams", role: "Compliance Officer", availability: "available" },
  { id: "david", name: "David Martinez", role: "Quality Manager", availability: "available" }
]

export function ScheduleAudit() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [newAudit, setNewAudit] = useState({
    type: "",
    date: "",
    time: "",
    location: "",
    auditor: "",
    notes: "",
    priority: "medium"
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-orange-100 text-orange-800"
      case "low":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredAudits = scheduledAudits.filter(audit => {
    const matchesSearch = audit.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         audit.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         audit.auditor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || audit.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleScheduleAudit = () => {
    // Here you would typically save the audit to your backend
    console.log("Scheduling audit:", newAudit)
    setShowScheduleDialog(false)
    // Reset form
    setNewAudit({
      type: "",
      date: "",
      time: "",
      location: "",
      auditor: "",
      notes: "",
      priority: "medium"
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1>Schedule Audit</h1>
          <p className="text-muted-foreground">Manage audit schedules and compliance reviews</p>
        </div>
        <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule New Audit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule New Audit</DialogTitle>
              <DialogDescription>
                Create a new audit appointment with all necessary details.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="audit-type">Audit Type</Label>
                <Select value={newAudit.type} onValueChange={(value) => setNewAudit({...newAudit, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select audit type" />
                  </SelectTrigger>
                  <SelectContent>
                    {auditTypes.map((type) => (
                      <SelectItem key={type.id} value={type.name}>
                        <div>
                          <div className="font-medium">{type.name}</div>
                          <div className="text-sm text-muted-foreground">{type.duration} • {type.frequency}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select value={newAudit.location} onValueChange={(value) => setNewAudit({...newAudit, location: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sunshine House">Sunshine House</SelectItem>
                    <SelectItem value="Ocean View">Ocean View</SelectItem>
                    <SelectItem value="Garden Villa">Garden Villa</SelectItem>
                    <SelectItem value="Central Office">Central Office</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  type="date"
                  value={newAudit.date}
                  onChange={(e) => setNewAudit({...newAudit, date: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  type="time"
                  value={newAudit.time}
                  onChange={(e) => setNewAudit({...newAudit, time: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="auditor">Auditor</Label>
                <Select value={newAudit.auditor} onValueChange={(value) => setNewAudit({...newAudit, auditor: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select auditor" />
                  </SelectTrigger>
                  <SelectContent>
                    {auditors.map((auditor) => (
                      <SelectItem key={auditor.id} value={auditor.name}>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{auditor.name}</div>
                            <div className="text-sm text-muted-foreground">{auditor.role}</div>
                          </div>
                          <Badge variant={auditor.availability === "available" ? "default" : "secondary"}>
                            {auditor.availability}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={newAudit.priority} onValueChange={(value) => setNewAudit({...newAudit, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  placeholder="Add any additional notes or requirements for this audit..."
                  value={newAudit.notes}
                  onChange={(e) => setNewAudit({...newAudit, notes: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleScheduleAudit}>
                Schedule Audit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <CalendarIcon className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <h3 className="text-blue-900">Scheduled</h3>
            <p className="text-2xl font-bold text-blue-800">12</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-orange-500 mb-2" />
            <h3 className="text-orange-900">This Week</h3>
            <p className="text-2xl font-bold text-orange-800">4</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <h3 className="text-green-900">Completed</h3>
            <p className="text-2xl font-bold text-green-800">28</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-2" />
            <h3 className="text-red-900">Overdue</h3>
            <p className="text-2xl font-bold text-red-800">2</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Audit Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
            
            <div className="mt-4 space-y-2">
              <h4 className="font-medium">Upcoming This Week</h4>
              <div className="space-y-2">
                {scheduledAudits.slice(0, 3).map((audit) => (
                  <div key={audit.id} className="p-2 border rounded text-sm">
                    <div className="font-medium">{audit.type}</div>
                    <div className="text-muted-foreground">{audit.date} at {audit.time}</div>
                    <div className="text-muted-foreground">{audit.location}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scheduled Audits List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Scheduled Audits</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search audits..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredAudits.map((audit) => (
              <div key={audit.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{audit.type}</h4>
                      <Badge className={getStatusColor(audit.status)}>
                        {audit.status}
                      </Badge>
                      <Badge className={getPriorityColor(audit.priority)}>
                        {audit.priority} priority
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {audit.date} at {audit.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {audit.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {audit.auditor}
                      </div>
                    </div>
                    
                    {audit.notes && (
                      <p className="text-sm text-muted-foreground">{audit.notes}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Bell className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Audit Types Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Types & Frequency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {auditTypes.map((type) => (
              <div key={type.id} className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">{type.name}</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{type.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frequency:</span>
                    <span>{type.frequency}</span>
                  </div>
                </div>
                <Button size="sm" className="w-full mt-3">
                  Schedule This Audit
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}