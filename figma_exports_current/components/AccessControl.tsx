import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Badge } from "./ui/badge"
import { Plus, Search, Download, Edit, RefreshCw, Shield } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

export function AccessControl() {
  const [activeTab, setActiveTab] = useState("roles")
  const [searchTerm, setSearchTerm] = useState("")

  const roleAssignments = [
    {
      id: 1,
      positions: ["Support Worker – SIL"],
      roles: ["Care Provider", "Documentation"],
      accessLevel: "Limited",
      assignedCount: 12
    },
    {
      id: 2,
      positions: ["House Manager"],
      roles: ["Team Leader", "Care Provider", "Documentation", "Roster Management"],
      accessLevel: "Moderate",
      assignedCount: 3
    },
    {
      id: 3,
      positions: ["Admin"],
      roles: ["Documentation", "System Admin"],
      accessLevel: "Limited",
      assignedCount: 2
    },
    {
      id: 4,
      positions: ["Finance Manager"],
      roles: ["Financial Access", "Reporting", "System Admin"],
      accessLevel: "Moderate",
      assignedCount: 1
    },
    {
      id: 5,
      positions: ["Director"],
      roles: ["Full Access", "System Admin", "User Management"],
      accessLevel: "Full",
      assignedCount: 1
    }
  ]

  const permissionMatrix = [
    {
      module: "Dashboard",
      supportWorker: "View",
      houseManager: "View",
      admin: "View",
      financeManager: "View",
      director: "Edit"
    },
    {
      module: "Incident Reports",
      supportWorker: "View",
      houseManager: "Edit",
      admin: "View",
      financeManager: "View",
      director: "Edit"
    },
    {
      module: "Client Profiles",
      supportWorker: "View",
      houseManager: "Edit",
      admin: "No Access",
      financeManager: "View",
      director: "Edit"
    },
    {
      module: "Financial Reports",
      supportWorker: "No Access",
      houseManager: "No Access",
      admin: "No Access",
      financeManager: "Edit",
      director: "Edit"
    },
    {
      module: "User Management",
      supportWorker: "No Access",
      houseManager: "No Access",
      admin: "View",
      financeManager: "No Access",
      director: "Edit"
    },
    {
      module: "System Settings",
      supportWorker: "No Access",
      houseManager: "No Access",
      admin: "Edit",
      financeManager: "No Access",
      director: "Edit"
    },
    {
      module: "Audit Logs",
      supportWorker: "No Access",
      houseManager: "View",
      admin: "View",
      financeManager: "View",
      director: "Edit"
    }
  ]

  const getAccessLevelBadgeVariant = (level: string) => {
    switch (level) {
      case "Full": return "destructive"
      case "Moderate": return "default"
      case "Limited": return "secondary"
      default: return "outline"
    }
  }

  const getPermissionBadgeVariant = (permission: string) => {
    switch (permission) {
      case "Edit": return "default"
      case "View": return "secondary"
      case "No Access": return "outline"
      default: return "outline"
    }
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">Access Control</h1>
          <p className="text-gray-600">Manage roles, permissions, and security access across the platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync with
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-purple-900 mb-1">Secure & Compliant Access</h3>
              <p className="text-purple-700 text-sm">Proper access controls protect client privacy and ensure staff have the right tools to provide excellent care.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === "roles" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("roles")}
          className="rounded-md"
        >
          Role Assignment
        </Button>
        <Button
          variant={activeTab === "permissions" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("permissions")}
          className="rounded-md"
        >
          Permission Matrix
        </Button>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search roles and permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Role
          </Button>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Permission
          </Button>
        </div>
      </div>

      {/* Role Assignment Table */}
      {activeTab === "roles" && (
        <Card>
          <CardHeader>
            <CardTitle>Role Assignment ({roleAssignments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position(s)</TableHead>
                  <TableHead>Role(s) Assigned</TableHead>
                  <TableHead>Access Level</TableHead>
                  <TableHead>Assigned Staff</TableHead>
                  <TableHead className="w-24">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roleAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.positions.join(", ")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {assignment.roles.slice(0, 2).map((role, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                        {assignment.roles.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{assignment.roles.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getAccessLevelBadgeVariant(assignment.accessLevel)}>
                        {assignment.accessLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{assignment.assignedCount} staff</span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Permission Matrix Table */}
      {activeTab === "permissions" && (
        <Card>
          <CardHeader>
            <CardTitle>Permission Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-40">Module Feature</TableHead>
                    <TableHead className="text-center min-w-32">Support Worker</TableHead>
                    <TableHead className="text-center min-w-32">House Manager</TableHead>
                    <TableHead className="text-center min-w-32">Admin</TableHead>
                    <TableHead className="text-center min-w-32">Finance Manager</TableHead>
                    <TableHead className="text-center min-w-32">Director</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissionMatrix.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.module}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getPermissionBadgeVariant(row.supportWorker)} className="text-xs">
                          {row.supportWorker}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getPermissionBadgeVariant(row.houseManager)} className="text-xs">
                          {row.houseManager}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getPermissionBadgeVariant(row.admin)} className="text-xs">
                          {row.admin}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getPermissionBadgeVariant(row.financeManager)} className="text-xs">
                          {row.financeManager}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getPermissionBadgeVariant(row.director)} className="text-xs">
                          {row.director}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Actions */}
      <div className="flex gap-2 pt-4">
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Roles
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Matrix
        </Button>
      </div>
    </div>
  )
}