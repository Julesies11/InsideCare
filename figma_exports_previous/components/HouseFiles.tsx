import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { 
  Search, 
  Filter, 
  Upload, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  FileText, 
  Folder, 
  FolderOpen, 
  File, 
  Calendar, 
  User, 
  AlertTriangle, 
  MapPin
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

// Mock data for house files
const houseFiles = [
  {
    id: 1,
    name: "Emergency Evacuation Plan.pdf",
    type: "Emergency Plan",
    house: "Sunshine House",
    category: "Safety",
    size: "2.3 MB",
    uploadedBy: "Jennifer Adams",
    uploadedDate: "2024-01-15",
    lastModified: "2024-01-15",
    version: "v1.0",
    status: "Current"
  },
  {
    id: 2,
    name: "Daily Routine Schedule.docx",
    type: "Routine",
    house: "Sunshine House",
    category: "Operations",
    size: "456 KB",
    uploadedBy: "Sarah Wilson", 
    uploadedDate: "2024-01-10",
    lastModified: "2024-01-18",
    version: "v2.1",
    status: "Current"
  },
  {
    id: 3,
    name: "House Rules and Guidelines.pdf",
    type: "Policy",
    house: "Ocean View",
    category: "Policies",
    size: "1.8 MB",
    uploadedBy: "Mark Thompson",
    uploadedDate: "2023-12-20",
    lastModified: "2024-01-05",
    version: "v1.3",
    status: "Current"
  },
  {
    id: 4,
    name: "Kitchen Safety Procedures.pdf",
    type: "Procedure",
    house: "Garden Villa",
    category: "Safety",
    size: "890 KB",
    uploadedBy: "David Martinez",
    uploadedDate: "2024-01-08",
    lastModified: "2024-01-08",
    version: "v1.0",
    status: "Current"
  },
  {
    id: 5,
    name: "Medication Management Protocol.docx",
    type: "Protocol",
    house: "All Houses",
    category: "Medical",
    size: "1.2 MB",
    uploadedBy: "Lisa Chen",
    uploadedDate: "2024-01-12",
    lastModified: "2024-01-12",
    version: "v1.0",
    status: "Current"
  },
  {
    id: 6,
    name: "Old Emergency Plan.pdf",
    type: "Emergency Plan",
    house: "Sunshine House",
    category: "Safety",
    size: "2.1 MB",
    uploadedBy: "Jennifer Adams",
    uploadedDate: "2023-11-15",
    lastModified: "2023-11-15",
    version: "v0.9",
    status: "Archived"
  }
]

const categories = [
  { name: "Safety", icon: AlertTriangle, color: "text-red-600" },
  { name: "Operations", icon: FileText, color: "text-blue-600" },
  { name: "Policies", icon: File, color: "text-purple-600" },
  { name: "Medical", icon: FileText, color: "text-green-600" }
]

export function HouseFiles() {
  const [searchTerm, setSearchTerm] = useState("")
  const [houseFilter, setHouseFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("current")
  const [viewMode, setViewMode] = useState("table") // table or folders
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [showFileDialog, setShowFileDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  const filteredFiles = houseFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesHouse = houseFilter === "all" || file.house === houseFilter
    const matchesCategory = categoryFilter === "all" || file.category === categoryFilter
    const matchesType = typeFilter === "all" || file.type === typeFilter
    const matchesStatus = statusFilter === "all" || file.status.toLowerCase() === statusFilter
    
    return matchesSearch && matchesHouse && matchesCategory && matchesType && matchesStatus
  })

  const viewFile = (file: any) => {
    setSelectedFile(file)
    setShowFileDialog(true)
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf': return <FileText className="h-5 w-5 text-red-600" />
      case 'docx': case 'doc': return <FileText className="h-5 w-5 text-blue-600" />
      case 'xlsx': case 'xls': return <FileText className="h-5 w-5 text-green-600" />
      default: return <File className="h-5 w-5 text-gray-600" />
    }
  }

  const FileViewDialog = () => (
    <Dialog open={showFileDialog} onOpenChange={setShowFileDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>File Details</DialogTitle>
          <DialogDescription>
            View and manage file information and version history.
          </DialogDescription>
        </DialogHeader>
        
        {selectedFile && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {getFileIcon(selectedFile.name)}
              <div>
                <h3 className="text-lg">{selectedFile.name}</h3>
                <p className="text-muted-foreground">{selectedFile.type}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">House</p>
                <p className="text-sm text-muted-foreground">{selectedFile.house}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Category</p>
                <p className="text-sm text-muted-foreground">{selectedFile.category}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Size</p>
                <p className="text-sm text-muted-foreground">{selectedFile.size}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Version</p>
                <p className="text-sm text-muted-foreground">{selectedFile.version}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Uploaded By</p>
                <p className="text-sm text-muted-foreground">{selectedFile.uploadedBy}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Last Modified</p>
                <p className="text-sm text-muted-foreground">{selectedFile.lastModified}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload New Version
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )

  const UploadDialog = () => (
    <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Upload a new house document or file.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">File</label>
            <Input type="file" />
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
              <label className="text-sm font-medium">Category</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Safety">Safety</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Policies">Policies</SelectItem>
                  <SelectItem value="Medical">Medical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">File Type</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Emergency Plan">Emergency Plan</SelectItem>
                <SelectItem value="Routine">Routine</SelectItem>
                <SelectItem value="Policy">Policy</SelectItem>
                <SelectItem value="Procedure">Procedure</SelectItem>
                <SelectItem value="Protocol">Protocol</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowUploadDialog(false)}>
              Upload File
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  const FolderView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {categories.map((category) => {
        const categoryFiles = filteredFiles.filter(file => file.category === category.name)
        const Icon = category.icon
        
        return (
          <Card key={category.name} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                  <Icon className={`h-6 w-6 ${category.color}`} />
                </div>
                <div>
                  <h3 className="font-medium">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {categoryFiles.length} file{categoryFiles.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1>House Files</h1>
          <p className="text-muted-foreground">Manage house-specific documents and procedures</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={viewMode === "folders" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("folders")}
          >
            <Folder className="h-4 w-4 mr-2" />
            Folders
          </Button>
          <Button 
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Table
          </Button>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-orange-900">Organized Excellence</h3>
              <p className="text-orange-700">
                Well-organized documentation ensures consistent, safe, and compliant care delivery. 
                Every file contributes to creating secure and supportive living environments.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search files..." 
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
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Safety">Safety</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
                <SelectItem value="Policies">Policies</SelectItem>
                <SelectItem value="Medical">Medical</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Emergency Plan">Emergency Plan</SelectItem>
                <SelectItem value="Routine">Routine</SelectItem>
                <SelectItem value="Policy">Policy</SelectItem>
                <SelectItem value="Procedure">Procedure</SelectItem>
                <SelectItem value="Protocol">Protocol</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {viewMode === "folders" ? (
        <FolderView />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>House</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.name)}
                        <span>{file.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{file.type}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {file.house}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{file.category}</Badge>
                    </TableCell>
                    <TableCell>{file.size}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {file.lastModified}
                      </div>
                    </TableCell>
                    <TableCell>{file.version}</TableCell>
                    <TableCell>
                      <Badge variant={file.status === "Current" ? "default" : "secondary"}>
                        {file.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => viewFile(file)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
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

      <FileViewDialog />
      <UploadDialog />
    </div>
  )
}