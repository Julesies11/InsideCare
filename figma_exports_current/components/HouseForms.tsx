import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Download, 
  FileText, 
  User, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FormInput
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

// Mock data for house forms
const houseForms = [
  {
    id: 1,
    name: "Daily Medication Log",
    type: "Medical",
    house: "Sunshine House",
    linkedParticipants: ["Sarah Johnson", "David Rodriguez"],
    status: "Active",
    lastUpdated: "2024-01-22",
    createdBy: "Jennifer Adams",
    description: "Track daily medication administration and observations",
    frequency: "Daily",
    completionRate: 95
  },
  {
    id: 2,
    name: "Incident Report Form", 
    type: "Safety",
    house: "All Houses",
    linkedParticipants: [],
    status: "Active",
    lastUpdated: "2024-01-20",
    createdBy: "Sarah Wilson",
    description: "Report any incidents, accidents, or unusual occurrences",
    frequency: "As Needed",
    completionRate: 100
  },
  {
    id: 3,
    name: "Weekly Menu Planning",
    type: "Nutrition",
    house: "Ocean View", 
    linkedParticipants: ["Michael Chen"],
    status: "Active",
    lastUpdated: "2024-01-15",
    createdBy: "Mark Thompson",
    description: "Plan weekly meals considering dietary requirements and preferences",
    frequency: "Weekly",
    completionRate: 85
  },
  {
    id: 4,
    name: "Personal Care Assessment",
    type: "Care Plan",
    house: "Garden Villa",
    linkedParticipants: ["Emma Williams"],
    status: "Draft",
    lastUpdated: "2024-01-18",
    createdBy: "Lisa Chen",
    description: "Assess personal care needs and update support strategies",
    frequency: "Monthly",
    completionRate: 0
  },
  {
    id: 5,
    name: "Community Outing Evaluation",
    type: "Activities",
    house: "Sunshine House",
    linkedParticipants: ["Sarah Johnson", "David Rodriguez"],
    status: "Archived",
    lastUpdated: "2023-12-30",
    createdBy: "Jennifer Adams",
    description: "Evaluate community outings and participant engagement",
    frequency: "Per Activity",
    completionRate: 90
  }
]

// Mock form submissions
const formSubmissions = [
  {
    id: 1,
    formId: 1,
    formName: "Daily Medication Log",
    submittedBy: "Jennifer Adams",
    submittedDate: "2024-01-22",
    participant: "Sarah Johnson",
    status: "Complete"
  },
  {
    id: 2,
    formId: 2,
    formName: "Incident Report Form",
    submittedBy: "Mark Thompson",
    submittedDate: "2024-01-21",
    participant: null,
    status: "Under Review"
  },
  {
    id: 3,
    formId: 3,
    formName: "Weekly Menu Planning",
    submittedBy: "Mark Thompson",
    submittedDate: "2024-01-20",
    participant: "Michael Chen",
    status: "Approved"
  }
]

export function HouseForms() {
  const [activeTab, setActiveTab] = useState("forms")
  const [searchTerm, setSearchTerm] = useState("")
  const [houseFilter, setHouseFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedForm, setSelectedForm] = useState<any>(null)
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)

  const filteredForms = houseForms.filter(form => {
    const matchesSearch = form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         form.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesHouse = houseFilter === "all" || form.house === houseFilter
    const matchesType = typeFilter === "all" || form.type === typeFilter
    const matchesStatus = statusFilter === "all" || form.status.toLowerCase() === statusFilter
    
    return matchesSearch && matchesHouse && matchesType && matchesStatus
  })

  const filteredSubmissions = formSubmissions.filter(submission => {
    const matchesSearch = submission.formName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.submittedBy.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const viewForm = (form: any) => {
    setSelectedForm(form)
    setShowFormDialog(true)
  }

  const assignForm = (form: any) => {
    setSelectedForm(form)
    setShowAssignDialog(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active": return <CheckCircle className="h-4 w-4 text-green-600" />
      case "Draft": return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "Archived": return <XCircle className="h-4 w-4 text-gray-600" />
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "default"
      case "Draft": return "secondary"
      case "Archived": return "outline"
      case "Complete": return "default"
      case "Under Review": return "secondary"
      case "Approved": return "default"
      default: return "outline"
    }
  }

  const FormDialog = () => (
    <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Form Details</DialogTitle>
          <DialogDescription>
            View form information and assignment details.
          </DialogDescription>
        </DialogHeader>
        
        {selectedForm && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <div>
                <h3 className="text-lg">{selectedForm.name}</h3>
                <p className="text-muted-foreground">{selectedForm.type}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">House</p>
                <p className="text-sm text-muted-foreground">{selectedForm.house}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Frequency</p>
                <p className="text-sm text-muted-foreground">{selectedForm.frequency}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Created By</p>
                <p className="text-sm text-muted-foreground">{selectedForm.createdBy}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">{selectedForm.lastUpdated}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm text-muted-foreground">{selectedForm.description}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium">Linked Participants</p>
              <div className="flex gap-1 mt-1">
                {selectedForm.linkedParticipants.length > 0 ? (
                  selectedForm.linkedParticipants.map((participant: string) => (
                    <Badge key={participant} variant="outline">{participant}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Not linked to specific participants</span>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Preview Form
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Form
              </Button>
              <Button variant="outline" size="sm" onClick={() => assignForm(selectedForm)}>
                <User className="h-4 w-4 mr-2" />
                Assign Form
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )

  const CreateFormDialog = () => (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Form</DialogTitle>
          <DialogDescription>
            Create a new form template for house operations.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Form Name</label>
            <Input placeholder="Enter form name" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Form Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Medical">Medical</SelectItem>
                  <SelectItem value="Safety">Safety</SelectItem>
                  <SelectItem value="Care Plan">Care Plan</SelectItem>
                  <SelectItem value="Activities">Activities</SelectItem>
                  <SelectItem value="Nutrition">Nutrition</SelectItem>
                  <SelectItem value="Assessment">Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">House</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select house" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Houses">All Houses</SelectItem>
                  <SelectItem value="Sunshine House">Sunshine House</SelectItem>
                  <SelectItem value="Ocean View">Ocean View</SelectItem>
                  <SelectItem value="Garden Villa">Garden Villa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Frequency</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Daily">Daily</SelectItem>
                <SelectItem value="Weekly">Weekly</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="As Needed">As Needed</SelectItem>
                <SelectItem value="Per Activity">Per Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input placeholder="Enter form description" />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCreateDialog(false)}>
              Create Form
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  const AssignFormDialog = () => (
    <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Form</DialogTitle>
          <DialogDescription>
            Assign this form to specific participants or staff members.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Assign To</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select assignment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="participant">Specific Participant</SelectItem>
                <SelectItem value="staff">Specific Staff Member</SelectItem>
                <SelectItem value="house">All Staff in House</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Select Person/Group</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sarah Johnson">Sarah Johnson (Participant)</SelectItem>
                <SelectItem value="Michael Chen">Michael Chen (Participant)</SelectItem>
                <SelectItem value="Jennifer Adams">Jennifer Adams (Staff)</SelectItem>
                <SelectItem value="Mark Thompson">Mark Thompson (Staff)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Due Date</label>
            <Input type="date" />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowAssignDialog(false)}>
              Assign Form
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1>House Forms</h1>
          <p className="text-muted-foreground">Manage house-specific forms and documentation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Form
          </Button>
        </div>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-violet-100 rounded-full flex items-center justify-center">
              <FormInput className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <h3 className="text-violet-900">Streamlined Documentation</h3>
              <p className="text-violet-700">
                Efficient forms and documentation systems ensure comprehensive care tracking and compliance. 
                Your organized approach supports better outcomes for every participant.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-2">
        <Button 
          variant={activeTab === "forms" ? "default" : "outline"}
          onClick={() => setActiveTab("forms")}
        >
          Forms Library
        </Button>
        <Button 
          variant={activeTab === "submissions" ? "default" : "outline"}
          onClick={() => setActiveTab("submissions")}
        >
          Recent Submissions
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search forms..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {activeTab === "forms" && (
              <>
                <Select value={houseFilter} onValueChange={setHouseFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Houses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Houses</SelectItem>
                    <SelectItem value="Sunshine House">Sunshine House</SelectItem>
                    <SelectItem value="Ocean View">Ocean View</SelectItem>
                    <SelectItem value="Garden Villa">Garden Villa</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Medical">Medical</SelectItem>
                    <SelectItem value="Safety">Safety</SelectItem>
                    <SelectItem value="Care Plan">Care Plan</SelectItem>
                    <SelectItem value="Activities">Activities</SelectItem>
                    <SelectItem value="Nutrition">Nutrition</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {activeTab === "forms" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>House</TableHead>
                  <TableHead>Linked Participants</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredForms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {form.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{form.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {form.house}
                      </div>
                    </TableCell>
                    <TableCell>
                      {form.linkedParticipants.length > 0 ? (
                        <div className="flex gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {form.linkedParticipants.length} participant{form.linkedParticipants.length > 1 ? 's' : ''}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {form.frequency}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(form.status)}
                        <Badge variant={getStatusColor(form.status)}>
                          {form.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {form.lastUpdated}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => viewForm(form)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => assignForm(form)}
                        >
                          <User className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form Name</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {submission.formName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {submission.submittedBy}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {submission.submittedDate}
                      </div>
                    </TableCell>
                    <TableCell>
                      {submission.participant || (
                        <span className="text-muted-foreground italic">General</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(submission.status)}>
                        {submission.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <FormDialog />
      <CreateFormDialog />
      <AssignFormDialog />
    </div>
  )
}