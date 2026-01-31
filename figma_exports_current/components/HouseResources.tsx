import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { 
  Search, 
  Plus, 
  Phone, 
  MapPin, 
  ExternalLink, 
  Download, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Users, 
  Coffee, 
  Printer, 
  BookOpen, 
  Star, 
  Heart
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Textarea } from "./ui/textarea"

// Mock data for house resources
const houseResources = [
  {
    id: 1,
    title: "Emergency Services",
    category: "Emergency",
    type: "Contact",
    house: "All Houses",
    description: "Primary emergency contact numbers",
    content: {
      phone: "000",
      address: "Emergency Services",
      notes: "For life-threatening emergencies only"
    },
    priority: "Critical",
    lastUpdated: "2024-01-15"
  },
  {
    id: 2,
    title: "Local GP Clinic",
    category: "Medical",
    type: "Contact", 
    house: "Sunshine House",
    description: "Primary healthcare provider for house residents",
    content: {
      phone: "(03) 9876 5432",
      address: "123 Main Street, Sunshine VIC 3020",
      notes: "Dr. Smith - bulk billing available, wheelchair accessible"
    },
    priority: "High",
    lastUpdated: "2024-01-10"
  },
  {
    id: 3,
    title: "Community Center Programs",
    category: "Activities",
    type: "Service",
    house: "Ocean View",
    description: "Local community programs and activities",
    content: {
      phone: "(03) 9234 5678",
      address: "456 Community Drive, Ocean View VIC 3015",
      notes: "Art classes Tuesdays, exercise group Thursdays, social events monthly"
    },
    priority: "Medium",
    lastUpdated: "2024-01-08"
  },
  {
    id: 4,
    title: "Cooking Skills Workbook",
    category: "Activities",
    type: "Guide",
    house: "All Houses",
    description: "Step-by-step cooking instructions for common meals",
    content: {
      downloadUrl: "/resources/cooking-workbook.pdf",
      pages: 45,
      notes: "Includes pictures, safety tips, and adapted instructions"
    },
    priority: "Medium",
    lastUpdated: "2024-01-12"
  },
  {
    id: 5,
    title: "Local Library",
    category: "Activities",
    type: "Service",
    house: "Garden Villa",
    description: "Public library with accessible services",
    content: {
      phone: "(03) 9345 6789",
      address: "789 Reading Avenue, Garden Villa VIC 3025",
      notes: "Large print books, computer access, story time sessions"
    },
    priority: "Low",
    lastUpdated: "2024-01-05"
  },
  {
    id: 6,
    title: "Personal Hygiene Checklist",
    category: "Activities",
    type: "Guide",
    house: "All Houses",
    description: "Visual checklist for daily personal care routines",
    content: {
      downloadUrl: "/resources/hygiene-checklist.pdf",
      pages: 8,
      notes: "Printable with pictures, suitable for bathroom display"
    },
    priority: "Medium",
    lastUpdated: "2024-01-18"
  },
  {
    id: 7,
    title: "Taxi Service - Accessible",
    category: "Transport",
    type: "Contact",
    house: "All Houses",
    description: "Wheelchair accessible taxi service",
    content: {
      phone: "(03) 9456 7890",
      address: "24/7 Service",
      notes: "Book 30 minutes in advance, accepts NDIS transport funding"
    },
    priority: "High",
    lastUpdated: "2024-01-20"
  }
]

const categories = [
  { name: "Emergency", icon: AlertTriangle, color: "text-red-600 bg-red-50 border-red-200" },
  { name: "Medical", icon: Heart, color: "text-green-600 bg-green-50 border-green-200" },
  { name: "Activities", icon: Coffee, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { name: "Transport", icon: MapPin, color: "text-purple-600 bg-purple-50 border-purple-200" }
]

export function HouseResources() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [houseFilter, setHouseFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedResource, setSelectedResource] = useState<any>(null)
  const [showResourceDialog, setShowResourceDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const filteredResources = houseResources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || resource.category === categoryFilter
    const matchesHouse = houseFilter === "all" || resource.house === houseFilter
    const matchesType = typeFilter === "all" || resource.type === typeFilter
    
    return matchesSearch && matchesCategory && matchesHouse && matchesType
  })

  const viewResource = (resource: any) => {
    setSelectedResource(resource)
    setShowResourceDialog(true)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "destructive"
      case "High": return "default"
      case "Medium": return "secondary"
      case "Low": return "outline"
      default: return "outline"
    }
  }

  const getCategoryConfig = (category: string) => {
    return categories.find(c => c.name === category) || categories[0]
  }

  const ResourceDialog = () => (
    <Dialog open={showResourceDialog} onOpenChange={setShowResourceDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Resource Details</DialogTitle>
          <DialogDescription>
            View detailed resource information and contact details.
          </DialogDescription>
        </DialogHeader>
        
        {selectedResource && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {(() => {
                const config = getCategoryConfig(selectedResource.category)
                const Icon = config.icon
                return <Icon className="h-8 w-8 text-muted-foreground" />
              })()}
              <div>
                <h3 className="text-lg">{selectedResource.title}</h3>
                <p className="text-muted-foreground">{selectedResource.description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Category</p>
                <Badge className={getCategoryConfig(selectedResource.category).color}>
                  {selectedResource.category}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Type</p>
                <Badge variant="outline">{selectedResource.type}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium">House</p>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{selectedResource.house}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Priority</p>
                <Badge variant={getPriorityColor(selectedResource.priority)}>
                  {selectedResource.priority}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              {selectedResource.content.phone && (
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{selectedResource.content.phone}</p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {selectedResource.content.address && (
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">{selectedResource.content.address}</p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {selectedResource.content.downloadUrl && (
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Printable Guide</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedResource.content.pages} pages
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            {selectedResource.content.notes && (
              <div>
                <p className="text-sm font-medium">Notes</p>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <p className="text-sm">{selectedResource.content.notes}</p>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Resource
              </Button>
              {selectedResource.content.downloadUrl && (
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Star className="h-4 w-4 mr-2" />
                Add to Favorites
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )

  const CreateResourceDialog = () => (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Resource</DialogTitle>
          <DialogDescription>
            Create a new resource for house use.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Resource Title</label>
            <Input placeholder="Enter resource title" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                  <SelectItem value="Medical">Medical</SelectItem>
                  <SelectItem value="Activities">Activities</SelectItem>
                  <SelectItem value="Transport">Transport</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Resource Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contact">Contact</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="Guide">Guide</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="text-sm font-medium">Priority</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea 
              placeholder="Enter resource description..."
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Phone (Optional)</label>
              <Input placeholder="Enter phone number" />
            </div>
            <div>
              <label className="text-sm font-medium">Address (Optional)</label>
              <Input placeholder="Enter address" />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Notes</label>
            <Textarea 
              placeholder="Additional notes or instructions..."
              rows={2}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCreateDialog(false)}>
              Add Resource
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
          <h1>House Resources</h1>
          <p className="text-muted-foreground">Centralized access to emergency contacts, services, and guides</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-amber-900">Connected Community Support</h3>
              <p className="text-amber-700">
                Having the right resources at your fingertips empowers participants to access community services, 
                build connections, and live independently with confidence.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search resources..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
                <SelectItem value="Medical">Medical</SelectItem>
                <SelectItem value="Activities">Activities</SelectItem>
                <SelectItem value="Transport">Transport</SelectItem>
              </SelectContent>
            </Select>
            
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
                <SelectItem value="Contact">Contact</SelectItem>
                <SelectItem value="Service">Service</SelectItem>
                <SelectItem value="Guide">Guide</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => {
          const config = getCategoryConfig(resource.category)
          const Icon = config.icon
          
          return (
            <Card 
              key={resource.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => viewResource(resource)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${config.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                      <Badge variant={getPriorityColor(resource.priority)} className="text-xs">
                        {resource.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{resource.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{resource.house}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {resource.type}
                    </Badge>
                  </div>
                  
                  {resource.content.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{resource.content.phone}</span>
                    </div>
                  )}
                  
                  {resource.content.downloadUrl && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Printable guide available</span>
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      View Details
                    </Button>
                    {resource.content.downloadUrl && (
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredResources.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No resources found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search filters or add a new resource.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </CardContent>
        </Card>
      )}

      <ResourceDialog />
      <CreateResourceDialog />
    </div>
  )
}