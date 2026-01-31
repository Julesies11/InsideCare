import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Archive, 
  User, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  Shield
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Progress } from "./ui/progress"

// Mock data for staff members
const staffMembers = [
  {
    id: 1,
    name: "Jennifer Adams",
    photo: "/api/placeholder/150/150",
    role: "House Manager", 
    department: "Operations",
    status: "Active",
    email: "j.adams@insidecare.com",
    phone: "(04) 1234 5678",
    startDate: "2022-03-15",
    compliance: {
      ndisScreening: { status: "Complete", expiry: "2025-03-15" },
      orientation: { status: "Complete", completion: "2022-03-20" },
      firstAid: { status: "Expiring Soon", expiry: "2024-02-10" },
      medications: { status: "Complete", completion: "2023-08-15" }
    },
    initials: "JA"
  },
  {
    id: 2,
    name: "Mark Thompson",
    photo: "/api/placeholder/150/150",
    role: "Support Worker",
    department: "Direct Care",
    status: "Active",
    email: "m.thompson@insidecare.com", 
    phone: "(04) 2345 6789",
    startDate: "2023-01-10",
    compliance: {
      ndisScreening: { status: "Complete", expiry: "2026-01-10" },
      orientation: { status: "Complete", completion: "2023-01-15" },
      firstAid: { status: "Complete", expiry: "2025-01-10" },
      medications: { status: "Incomplete", completion: null }
    },
    initials: "MT"
  },
  {
    id: 3,
    name: "Sarah Wilson",
    photo: "/api/placeholder/150/150",
    role: "Team Leader",
    department: "Operations",
    status: "Active",
    email: "s.wilson@insidecare.com",
    phone: "(04) 3456 7890",
    startDate: "2021-08-22",
    compliance: {
      ndisScreening: { status: "Complete", expiry: "2024-08-22" },
      orientation: { status: "Complete", completion: "2021-08-25" },
      firstAid: { status: "Complete", expiry: "2025-08-22" },
      medications: { status: "Complete", completion: "2022-03-10" }
    },
    initials: "SW"
  },
  {
    id: 4,
    name: "David Martinez",
    photo: "/api/placeholder/150/150",
    role: "Support Worker",
    department: "Direct Care",
    status: "Inactive",
    email: "d.martinez@insidecare.com",
    phone: "(04) 4567 8901",
    startDate: "2022-11-05",
    compliance: {
      ndisScreening: { status: "Expired", expiry: "2023-11-05" },
      orientation: { status: "Complete", completion: "2022-11-08" },
      firstAid: { status: "Expired", expiry: "2023-11-05" },
      medications: { status: "Complete", completion: "2023-02-15" }
    },
    initials: "DM"
  },
  {
    id: 5,
    name: "Lisa Chen",
    photo: "/api/placeholder/150/150",
    role: "Admin Assistant",
    department: "Administration",
    status: "Active",
    email: "l.chen@insidecare.com",
    phone: "(04) 5678 9012",
    startDate: "2023-06-12",
    compliance: {
      ndisScreening: { status: "Complete", expiry: "2026-06-12" },
      orientation: { status: "Complete", completion: "2023-06-15" },
      firstAid: { status: "Not Required", expiry: null },
      medications: { status: "Not Required", completion: null }
    },
    initials: "LC"
  }
]

export function StaffProfiles() {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [showProfileDialog, setShowProfileDialog] = useState(false)

  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || staff.role === roleFilter
    const matchesDepartment = departmentFilter === "all" || staff.department === departmentFilter
    const matchesStatus = statusFilter === "all" || staff.status.toLowerCase() === statusFilter
    
    return matchesSearch && matchesRole && matchesDepartment && matchesStatus
  })

  const viewProfile = (staff: any) => {
    setSelectedStaff(staff)
    setShowProfileDialog(true)
  }

  const getComplianceStatus = (compliance: any) => {
    const statuses = Object.values(compliance).map((item: any) => item.status)
    const complete = statuses.filter(status => status === "Complete").length
    const total = statuses.filter(status => status !== "Not Required").length
    
    if (complete === total) return { status: "Complete", percentage: 100 }
    if (statuses.some(status => status === "Expired" || status === "Incomplete")) return { status: "Issues", percentage: Math.round((complete / total) * 100) }
    if (statuses.some(status => status === "Expiring Soon")) return { status: "Expiring", percentage: Math.round((complete / total) * 100) }
    return { status: "In Progress", percentage: Math.round((complete / total) * 100) }
  }

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case "Complete": return <CheckCircle className="h-4 w-4 text-green-600" />
      case "Expiring Soon": return <AlertCircle className="h-4 w-4 text-orange-600" />
      case "Expired": case "Incomplete": return <XCircle className="h-4 w-4 text-red-600" />
      case "Not Required": return <CheckCircle className="h-4 w-4 text-gray-400" />
      default: return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  const ProfileDialog = () => {
    if (!selectedStaff) return null
    const complianceOverall = getComplianceStatus(selectedStaff.compliance)

    return (
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Staff Profile</DialogTitle>
            <DialogDescription>
              View detailed staff information and compliance status.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedStaff.photo} alt={selectedStaff.name} />
                      <AvatarFallback>{selectedStaff.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl">{selectedStaff.name}</h3>
                      <p className="text-muted-foreground">{selectedStaff.role}</p>
                      <p className="text-muted-foreground">{selectedStaff.department}</p>
                      <Badge variant={selectedStaff.status === "Active" ? "default" : "secondary"}>
                        {selectedStaff.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedStaff.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedStaff.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Started: {selectedStaff.startDate}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compliance Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Compliance Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(selectedStaff.compliance).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getComplianceIcon(value.status)}
                          <div>
                            <p className="capitalize">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {value.status === "Complete" && value.expiry && `Expires: ${value.expiry}`}
                              {value.status === "Complete" && value.completion && !value.expiry && `Completed: ${value.completion}`}
                              {value.status === "Expired" && `Expired: ${value.expiry}`}
                              {value.status === "Expiring Soon" && `Expires: ${value.expiry}`}
                              {value.status === "Incomplete" && "Requires completion"}
                              {value.status === "Not Required" && "Not applicable for this role"}
                            </p>
                          </div>
                        </div>
                        <Badge variant={
                          value.status === "Complete" ? "default" :
                          value.status === "Expiring Soon" ? "secondary" :
                          value.status === "Expired" || value.status === "Incomplete" ? "destructive" :
                          "outline"
                        }>
                          {value.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Compliance Summary */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Overall Status</span>
                      <span>{complianceOverall.status}</span>
                    </div>
                    <Progress value={complianceOverall.percentage} />
                    <div className="text-xs text-muted-foreground">
                      {complianceOverall.percentage}% Complete
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                    <Award className="h-4 w-4 mr-2" />
                    Update Training
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Schedule
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
          <h1>Staff Profiles</h1>
          <p className="text-muted-foreground">Manage staff information and compliance status</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-emerald-900">Empowering Our Care Team</h3>
              <p className="text-emerald-700">
                Our dedicated staff are the heart of quality care. Supporting their growth and compliance 
                ensures every participant receives the exceptional service they deserve.
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
                placeholder="Search staff by name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="House Manager">House Manager</SelectItem>
                <SelectItem value="Team Leader">Team Leader</SelectItem>
                <SelectItem value="Support Worker">Support Worker</SelectItem>
                <SelectItem value="Admin Assistant">Admin Assistant</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
                <SelectItem value="Direct Care">Direct Care</SelectItem>
                <SelectItem value="Administration">Administration</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Compliance Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((staff) => {
                const complianceStatus = getComplianceStatus(staff.compliance)
                return (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={staff.photo} alt={staff.name} />
                          <AvatarFallback>{staff.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p>{staff.name}</p>
                          <p className="text-sm text-muted-foreground">{staff.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{staff.role}</TableCell>
                    <TableCell>{staff.department}</TableCell>
                    <TableCell>
                      <Badge variant={staff.status === "Active" ? "default" : "secondary"}>
                        {staff.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            complianceStatus.status === "Complete" ? "default" :
                            complianceStatus.status === "Expiring" ? "secondary" :
                            complianceStatus.status === "Issues" ? "destructive" :
                            "outline"
                          }>
                            {complianceStatus.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {complianceStatus.percentage}% Complete
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => viewProfile(staff)}
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
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ProfileDialog />
    </div>
  )
}