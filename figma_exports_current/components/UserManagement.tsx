import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Label } from "./ui/label"
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Key, 
  Mail, 
  Phone, 
  Shield, 
  Calendar, 
  Activity,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Crown,
  User,
  Clock
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Switch } from "./ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

const users = [
  {
    id: 1,
    name: "Sarah Wilson",
    email: "sarah.wilson@insidecare.com.au",
    phone: "+61 412 345 678",
    role: "Administrator",
    status: "active",
    lastActive: "2 hours ago",
    joinDate: "2023-01-15",
    permissions: ["full_access", "user_management", "reports", "audit"],
    houses: ["Sunshine House", "Ocean View"]
  },
  {
    id: 2,
    name: "Mark Thompson",
    email: "mark.thompson@insidecare.com.au",
    phone: "+61 423 456 789",
    role: "House Manager",
    status: "active",
    lastActive: "1 hour ago",
    joinDate: "2023-03-20",
    permissions: ["house_management", "staff_scheduling", "reports"],
    houses: ["Garden Villa"]
  },
  {
    id: 3,
    name: "Jennifer Adams",
    email: "jennifer.adams@insidecare.com.au",
    phone: "+61 434 567 890",
    role: "Support Worker",
    status: "active",
    lastActive: "30 minutes ago",
    joinDate: "2023-06-10",
    permissions: ["participant_care", "shift_notes", "basic_reports"],
    houses: ["Sunshine House"]
  },
  {
    id: 4,
    name: "David Martinez",
    email: "david.martinez@insidecare.com.au",
    phone: "+61 445 678 901",
    role: "Compliance Officer",
    status: "inactive",
    lastActive: "2 days ago",
    joinDate: "2023-02-28",
    permissions: ["compliance", "audit", "reports", "documentation"],
    houses: ["All Houses"]
  },
  {
    id: 5,
    name: "Lisa Chen",
    email: "lisa.chen@insidecare.com.au",
    phone: "+61 456 789 012",
    role: "Support Worker",
    status: "pending",
    lastActive: "Never",
    joinDate: "2024-09-25",
    permissions: ["participant_care", "shift_notes"],
    houses: ["Ocean View"]
  }
]

const roles = [
  {
    id: "administrator",
    name: "Administrator",
    description: "Full system access and user management",
    permissions: ["full_access", "user_management", "reports", "audit", "settings"],
    color: "bg-red-100 text-red-800"
  },
  {
    id: "house_manager",
    name: "House Manager",
    description: "Manage specific houses and staff scheduling",
    permissions: ["house_management", "staff_scheduling", "reports", "participant_care"],
    color: "bg-blue-100 text-blue-800"
  },
  {
    id: "support_worker",
    name: "Support Worker",
    description: "Direct participant care and documentation",
    permissions: ["participant_care", "shift_notes", "basic_reports"],
    color: "bg-green-100 text-green-800"
  },
  {
    id: "compliance_officer",
    name: "Compliance Officer",
    description: "Audit, compliance, and quality assurance",
    permissions: ["compliance", "audit", "reports", "documentation"],
    color: "bg-purple-100 text-purple-800"
  }
]

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddUser, setShowAddUser] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    houses: []
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "suspended":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleColor = (role: string) => {
    const roleConfig = roles.find(r => r.name === role)
    return roleConfig?.color || "bg-gray-100 text-gray-800"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <UserCheck className="h-4 w-4" />
      case "inactive":
        return <UserX className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "suspended":
        return <Lock className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleAddUser = () => {
    // Here you would typically save the user to your backend
    console.log("Adding user:", newUser)
    setShowAddUser(false)
    // Reset form
    setNewUser({
      name: "",
      email: "",
      phone: "",
      role: "",
      houses: []
    })
  }

  const openUserDetails = (user: any) => {
    setSelectedUser(user)
    setShowUserDetails(true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1>User Management</h1>
          <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
        </div>
        <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add New User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account with appropriate role and permissions.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Full Name</Label>
                <Input
                  id="user-name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Enter full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="user-email">Email Address</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="user-phone">Phone Number</Label>
                <Input
                  id="user-phone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="user-role">Role</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        <div>
                          <div className="font-medium">{role.name}</div>
                          <div className="text-sm text-muted-foreground">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2 space-y-2">
                <Label>House Access</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">Sunshine House</Button>
                  <Button variant="outline" size="sm">Ocean View</Button>
                  <Button variant="outline" size="sm">Garden Villa</Button>
                  <Button variant="outline" size="sm">All Houses</Button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddUser(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser}>
                Create User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <h3 className="text-blue-900">Total Users</h3>
            <p className="text-2xl font-bold text-blue-800">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <UserCheck className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <h3 className="text-green-900">Active Users</h3>
            <p className="text-2xl font-bold text-green-800">{users.filter(u => u.status === 'active').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Crown className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <h3 className="text-purple-900">Administrators</h3>
            <p className="text-2xl font-bold text-purple-800">{users.filter(u => u.role === 'Administrator').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 mx-auto text-orange-500 mb-2" />
            <h3 className="text-orange-900">Online Now</h3>
            <p className="text-2xl font-bold text-orange-800">3</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search users..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{user.name}</h4>
                          <Badge className={getStatusColor(user.status)}>
                            {getStatusIcon(user.status)}
                            <span className="ml-1">{user.status}</span>
                          </Badge>
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email} • {user.phone}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last active: {user.lastActive} • Joined: {user.joinDate}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openUserDetails(user)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Definitions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {roles.map((role) => (
                <div key={role.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{role.name}</h4>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map((permission) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Activity className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm">Sarah Wilson logged in</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm">New user Lisa Chen was created</p>
                    <p className="text-xs text-muted-foreground">3 days ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Edit3 className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-sm">Mark Thompson's role was updated to House Manager</p>
                    <p className="text-xs text-muted-foreground">1 week ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View and edit user information and permissions.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {selectedUser.name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">{selectedUser.role}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge className={getStatusColor(selectedUser.status)}>
                      {selectedUser.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="text-sm">{selectedUser.phone}</p>
                </div>
                <div>
                  <Label>Join Date</Label>
                  <p className="text-sm">{selectedUser.joinDate}</p>
                </div>
                <div>
                  <Label>Last Active</Label>
                  <p className="text-sm">{selectedUser.lastActive}</p>
                </div>
              </div>
              
              <div>
                <Label>House Access</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedUser.houses.map((house: string) => (
                    <Badge key={house} variant="outline">{house}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Permissions</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedUser.permissions.map((permission: string) => (
                    <Badge key={permission} variant="secondary" className="text-xs">
                      {permission.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline">
                  <Lock className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
                <Button variant="outline">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit User
                </Button>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}