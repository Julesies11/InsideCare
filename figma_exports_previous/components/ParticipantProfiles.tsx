import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Archive, 
  User, 
  Heart, 
  Target, 
  FileText, 
  Pill, 
  StickyNote, 
  Shield, 
  Users as UsersIcon, 
  AlertTriangle,
  Download
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

// Mock data for participants
const participants = [
  {
    id: 1,
    name: "Sarah Johnson",
    photo: "/api/placeholder/150/150",
    ndisNumber: "NDIS-2024-001",
    house: "Sunshine House",
    status: "Active",
    dob: "1995-06-15",
    initials: "SJ"
  },
  {
    id: 2,
    name: "Michael Chen",
    photo: "/api/placeholder/150/150",
    ndisNumber: "NDIS-2024-002",
    house: "Ocean View",
    status: "Active",
    dob: "1992-03-22",
    initials: "MC"
  },
  {
    id: 3,
    name: "Emma Williams",
    photo: "/api/placeholder/150/150",
    ndisNumber: "NDIS-2024-003",
    house: "Garden Villa",
    status: "Inactive",
    dob: "1998-11-08",
    initials: "EW"
  },
  {
    id: 4,
    name: "David Rodriguez",
    photo: "/api/placeholder/150/150",
    ndisNumber: "NDIS-2024-004",
    house: "Sunshine House",
    status: "Active",
    dob: "1990-09-12",
    initials: "DR"
  }
]

export function ParticipantProfiles() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [houseFilter, setHouseFilter] = useState("all")
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null)
  const [showProfile, setShowProfile] = useState(false)

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.ndisNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || participant.status.toLowerCase() === statusFilter
    const matchesHouse = houseFilter === "all" || participant.house === houseFilter
    
    return matchesSearch && matchesStatus && matchesHouse
  })

  const openProfile = (participant: any) => {
    setSelectedParticipant(participant)
    setShowProfile(true)
  }

  const ProfileView = () => {
    if (!selectedParticipant) return null

    return (
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Participant Profile</DialogTitle>
            <DialogDescription>
              View and manage detailed participant information, goals, and support plans.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Profile Header */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedParticipant.photo} alt={selectedParticipant.name} />
                      <AvatarFallback>{selectedParticipant.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl">{selectedParticipant.name}</h3>
                      <p className="text-muted-foreground">DOB: {selectedParticipant.dob}</p>
                      <p className="text-muted-foreground">NDIS: {selectedParticipant.ndisNumber}</p>
                      <p className="text-muted-foreground">House: {selectedParticipant.house}</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Tabs */}
              <div className="mt-6">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="medical">Medical</TabsTrigger>
                    <TabsTrigger value="hygiene">Hygiene</TabsTrigger>
                    <TabsTrigger value="goals">Goals</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="forms">Forms/Logs</TabsTrigger>
                    <TabsTrigger value="medications">Medications</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                    <TabsTrigger value="practices">Restrictive Practices</TabsTrigger>
                    <TabsTrigger value="providers">Providers</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Basic Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p><strong>Age:</strong> 29 years old</p>
                            <p><strong>Emergency Contact:</strong> Jane Johnson (Mother)</p>
                            <p><strong>Phone:</strong> (04) 1234 5678</p>
                            <p><strong>Support Level:</strong> High</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Recent Activity
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm">• Attended physiotherapy session</p>
                            <p className="text-sm">• Completed daily living goals</p>
                            <p className="text-sm">• Medication administered on time</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="medical" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Heart className="h-5 w-5" />
                          Medical Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8 text-muted-foreground">
                          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                          <p>Restricted Access - Admin or House Manager Only</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="hygiene" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Personal Care & Hygiene</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p><strong>Morning Routine:</strong> Independent</p>
                              <p><strong>Shower:</strong> Requires assistance</p>
                            </div>
                            <div>
                              <p><strong>Dental Care:</strong> Supervised</p>
                              <p><strong>Grooming:</strong> Independent</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="goals" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          Current Goals
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="border rounded-lg p-4">
                            <h4>Independence Goal</h4>
                            <p className="text-sm text-muted-foreground">Improve meal preparation skills</p>
                            <div className="mt-2">
                              <Badge variant="outline">In Progress</Badge>
                            </div>
                          </div>
                          <div className="border rounded-lg p-4">
                            <h4>Social Goal</h4>
                            <p className="text-sm text-muted-foreground">Attend community activities weekly</p>
                            <div className="mt-2">
                              <Badge variant="outline">Active</Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="documents" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Documents
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 border rounded">
                            <span>Support Plan 2024.pdf</span>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between p-2 border rounded">
                            <span>Medical Assessment.pdf</span>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="forms" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Forms & Logs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Recent forms and logging entries will be displayed here.</p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="medications" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Pill className="h-5 w-5" />
                          Medications
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Medication</TableHead>
                              <TableHead>Dosage</TableHead>
                              <TableHead>Frequency</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>Medication A</TableCell>
                              <TableCell>10mg</TableCell>
                              <TableCell>Daily</TableCell>
                              <TableCell><Badge variant="outline">Active</Badge></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="notes" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <StickyNote className="h-5 w-5" />
                          Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Recent notes and observations will be displayed here.</p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="practices" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Restrictive Practices
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8 text-muted-foreground">
                          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                          <p>Restricted Access - Admin or House Manager Only</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="providers" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <UsersIcon className="h-5 w-5" />
                          Providers
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="border rounded-lg p-4">
                            <h4>Primary Care Provider</h4>
                            <p className="text-sm text-muted-foreground">Dr. Smith - General Practitioner</p>
                          </div>
                          <div className="border rounded-lg p-4">
                            <h4>Allied Health</h4>
                            <p className="text-sm text-muted-foreground">Physiotherapy Centre</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Quick Actions Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1>Participant Profiles</h1>
          <p className="text-muted-foreground">Manage participant information and profiles</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Participant
        </Button>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-blue-900">Supporting Every Individual Journey</h3>
              <p className="text-blue-700">
                Each participant profile represents a unique story of growth, independence, and achievement. 
                Your dedicated support makes their goals a reality.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search by name or NDIS number..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={houseFilter} onValueChange={setHouseFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="House" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Houses</SelectItem>
                  <SelectItem value="Sunshine House">Sunshine House</SelectItem>
                  <SelectItem value="Ocean View">Ocean View</SelectItem>
                  <SelectItem value="Garden Villa">Garden Villa</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participants Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead>NDIS Number</TableHead>
                <TableHead>House Assignment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParticipants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={participant.photo} alt={participant.name} />
                        <AvatarFallback>{participant.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p>{participant.name}</p>
                        <p className="text-sm text-muted-foreground">DOB: {participant.dob}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{participant.ndisNumber}</TableCell>
                  <TableCell>{participant.house}</TableCell>
                  <TableCell>
                    <Badge variant={participant.status === "Active" ? "default" : "secondary"}>
                      {participant.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openProfile(participant)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Archive className="h-4 w-4 mr-1" />
                        Archive
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ProfileView />
    </div>
  )
}