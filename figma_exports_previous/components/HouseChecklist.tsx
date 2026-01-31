import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Checkbox } from "./ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Textarea } from "./ui/textarea"
import { 
  Search, 
  Plus, 
  Edit, 
  History, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  User, 
  Calendar, 
  ClipboardList, 
  Thermometer, 
  Droplets, 
  Shield, 
  Utensils
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Progress } from "./ui/progress"

// Mock data for checklist templates
const checklistTemplates = [
  {
    id: 1,
    name: "Daily Safety Check",
    frequency: "Daily",
    house: "All Houses",
    tasks: [
      { id: 1, task: "Check fridge temperature (2-5°C)", icon: Thermometer, priority: "High" },
      { id: 2, task: "Test smoke alarm batteries", icon: Shield, priority: "High" },
      { id: 3, task: "Check all exits are clear", icon: Shield, priority: "High" },
      { id: 4, task: "Verify medication storage temperature", icon: Thermometer, priority: "Medium" },
      { id: 5, task: "Check hot water temperature", icon: Droplets, priority: "Medium" }
    ]
  },
  {
    id: 2,
    name: "Weekly Hygiene Review",
    frequency: "Weekly",
    house: "Sunshine House",
    tasks: [
      { id: 6, task: "Deep clean kitchen surfaces", icon: Utensils, priority: "High" },
      { id: 7, task: "Sanitize bathroom fixtures", icon: Droplets, priority: "High" },
      { id: 8, task: "Check personal hygiene supplies", icon: Droplets, priority: "Medium" },
      { id: 9, task: "Review participant hygiene goals", icon: User, priority: "Medium" },
      { id: 10, task: "Update hygiene care plans", icon: ClipboardList, priority: "Low" }
    ]
  }
]

// Mock data for completed checklists
const completedChecklists = [
  {
    id: 1,
    templateId: 1,
    templateName: "Daily Safety Check",
    house: "Sunshine House",
    completedBy: "Jennifer Adams",
    completedDate: "2024-01-22",
    completedTime: "08:30",
    totalTasks: 5,
    completedTasks: 5,
    status: "Complete",
    notes: "All checks passed. Fridge temperature slightly high but within acceptable range."
  },
  {
    id: 2,
    templateId: 1,
    templateName: "Daily Safety Check", 
    house: "Ocean View",
    completedBy: "Mark Thompson",
    completedDate: "2024-01-22",
    completedTime: "09:15",
    totalTasks: 5,
    completedTasks: 4,
    status: "Incomplete",
    notes: "Smoke alarm battery needs replacement in bedroom 2."
  },
  {
    id: 3,
    templateId: 2,
    templateName: "Weekly Hygiene Review",
    house: "Sunshine House",
    completedBy: "Sarah Wilson",
    completedDate: "2024-01-21",
    completedTime: "14:20",
    totalTasks: 5,
    completedTasks: 5,
    status: "Complete",
    notes: "All hygiene protocols up to date. Ordered additional supplies."
  }
]

export function HouseChecklist() {
  const [activeTab, setActiveTab] = useState("active")
  const [searchTerm, setSearchTerm] = useState("")
  const [houseFilter, setHouseFilter] = useState("all")
  const [frequencyFilter, setFrequencyFilter] = useState("all")
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [showChecklistDialog, setShowChecklistDialog] = useState(false)

  const filteredTemplates = checklistTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesHouse = houseFilter === "all" || template.house === houseFilter
    const matchesFrequency = frequencyFilter === "all" || template.frequency === frequencyFilter
    
    return matchesSearch && matchesHouse && matchesFrequency
  })

  const filteredHistory = completedChecklists.filter(checklist => {
    const matchesSearch = checklist.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         checklist.completedBy.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesHouse = houseFilter === "all" || checklist.house === houseFilter
    
    return matchesSearch && matchesHouse
  })

  const startChecklist = (template: any) => {
    setSelectedTemplate(template)
    setShowChecklistDialog(true)
  }

  const viewHistory = (template: any) => {
    setSelectedTemplate(template)
    setShowHistoryDialog(true)
  }

  const getCompletionPercentage = (completed: number, total: number) => {
    return Math.round((completed / total) * 100)
  }

  const CreateChecklistDialog = () => (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Checklist Template</DialogTitle>
          <DialogDescription>
            Create a new checklist template for house maintenance and compliance.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Checklist Name</label>
            <Input placeholder="Enter checklist name" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
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
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
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
            <label className="text-sm font-medium">Tasks</label>
            <div className="space-y-2">
              <Input placeholder="Task 1" />
              <Input placeholder="Task 2" />
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCreateDialog(false)}>
              Create Checklist
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  const ChecklistDialog = () => (
    <Dialog open={showChecklistDialog} onOpenChange={setShowChecklistDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{selectedTemplate?.name}</DialogTitle>
          <DialogDescription>
            Complete the checklist items and add any notes.
          </DialogDescription>
        </DialogHeader>
        
        {selectedTemplate && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{selectedTemplate.house}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{selectedTemplate.frequency}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              {selectedTemplate.tasks.map((task: any) => {
                const Icon = task.icon
                return (
                  <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Checkbox />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm">{task.task}</p>
                      <Badge 
                        variant={
                          task.priority === "High" ? "destructive" :
                          task.priority === "Medium" ? "secondary" : "outline"
                        }
                        className="text-xs"
                      >
                        {task.priority} Priority
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea 
                placeholder="Add any observations or issues..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowChecklistDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowChecklistDialog(false)}>
                Complete Checklist
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )

  const HistoryDialog = () => (
    <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Checklist History - {selectedTemplate?.name}</DialogTitle>
          <DialogDescription>
            View completion history and notes for this checklist.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Completed By</TableHead>
                <TableHead>House</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory
                .filter(h => h.templateId === selectedTemplate?.id)
                .map((history) => (
                <TableRow key={history.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm">{history.completedDate}</p>
                      <p className="text-xs text-muted-foreground">{history.completedTime}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {history.completedBy}
                    </div>
                  </TableCell>
                  <TableCell>{history.house}</TableCell>
                  <TableCell>
                    <Badge variant={history.status === "Complete" ? "default" : "secondary"}>
                      {history.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs">
                        {history.completedTasks}/{history.totalTasks} tasks
                      </div>
                      <Progress 
                        value={getCompletionPercentage(history.completedTasks, history.totalTasks)} 
                        className="h-2"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-xs truncate">{history.notes}</p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1>House Checklist</h1>
          <p className="text-muted-foreground">Manage daily and weekly house maintenance checklists</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Checklist
          </Button>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Template
          </Button>
        </div>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-cyan-100 rounded-full flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <h3 className="text-cyan-900">Consistent Care Standards</h3>
              <p className="text-cyan-700">
                Regular checklists ensure safe, healthy living environments and maintain high standards of care. 
                Your attention to detail creates secure homes where participants can thrive.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-2">
        <Button 
          variant={activeTab === "active" ? "default" : "outline"}
          onClick={() => setActiveTab("active")}
        >
          Active Checklists
        </Button>
        <Button 
          variant={activeTab === "history" ? "default" : "outline"}
          onClick={() => setActiveTab("history")}
        >
          <History className="h-4 w-4 mr-2" />
          View History
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search checklists..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
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
            
            {activeTab === "active" && (
              <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Frequencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Frequencies</SelectItem>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {activeTab === "active" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant="outline">{template.frequency}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {template.house}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm">
                    <p><strong>{template.tasks.length}</strong> tasks to complete</p>
                    <div className="mt-2">
                      {template.tasks.slice(0, 2).map((task, index) => {
                        const Icon = task.icon
                        return (
                          <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Icon className="h-3 w-3" />
                            <span className="truncate">{task.task}</span>
                          </div>
                        )
                      })}
                      {template.tasks.length > 2 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          +{template.tasks.length - 2} more tasks
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => startChecklist(template)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Start Checklist
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => viewHistory(template)}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Checklist</TableHead>
                  <TableHead>House</TableHead>
                  <TableHead>Completed By</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((history) => (
                  <TableRow key={history.id}>
                    <TableCell>{history.templateName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {history.house}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {history.completedBy}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{history.completedDate}</p>
                        <p className="text-xs text-muted-foreground">{history.completedTime}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={history.status === "Complete" ? "default" : "secondary"}>
                        {history.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-xs">
                          {history.completedTasks}/{history.totalTasks} tasks
                        </div>
                        <Progress 
                          value={getCompletionPercentage(history.completedTasks, history.totalTasks)} 
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-xs truncate">{history.notes}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <CreateChecklistDialog />
      <ChecklistDialog />
      <HistoryDialog />
    </div>
  )
}