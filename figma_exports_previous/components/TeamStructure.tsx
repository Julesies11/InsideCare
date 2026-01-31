import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Badge } from "./ui/badge"
import { Plus, Search, Filter, Download, Edit, Eye } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

export function TeamStructure() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("departments")

  const departments = [
    {
      id: 1,
      name: "Frontline Support Team",
      description: "Direct client support and daily care services",
      accessLevel: "Limited",
      status: "Active"
    },
    {
      id: 2,
      name: "Strategic Leadership",
      description: "Executive management and strategic planning",
      accessLevel: "Full",
      status: "Active"
    },
    {
      id: 3,
      name: "Billing & Reporting",
      description: "Financial management and compliance reporting",
      accessLevel: "Moderate",
      status: "Active"
    },
    {
      id: 4,
      name: "Administrative Support",
      description: "General administration and office management",
      accessLevel: "Limited",
      status: "Inactive"
    }
  ]

  const positions = [
    {
      id: 1,
      title: "Support Worker – SIL",
      department: "Frontline Support Team",
      complianceReqs: ["NDIS Orientation", "First Aid", "Medication", "Behaviour Support"],
      accessLevel: "Limited",
      status: "Active"
    },
    {
      id: 2,
      title: "House Manager",
      department: "Frontline Support Team",
      complianceReqs: ["NDIS Orientation", "First Aid", "Leadership", "Risk Management"],
      accessLevel: "Moderate",
      status: "Active"
    },
    {
      id: 3,
      title: "Admin",
      department: "Administrative Support",
      complianceReqs: ["NDIS Orientation", "Privacy Training"],
      accessLevel: "Limited",
      status: "Active"
    },
    {
      id: 4,
      title: "Finance Manager",
      department: "Billing & Reporting",
      complianceReqs: ["NDIS Orientation", "Financial Compliance", "Audit Training"],
      accessLevel: "Moderate",
      status: "Active"
    },
    {
      id: 5,
      title: "Director",
      department: "Strategic Leadership",
      complianceReqs: ["NDIS Orientation", "Leadership", "Governance"],
      accessLevel: "Full",
      status: "Active"
    }
  ]

  const getStatusBadgeVariant = (status: string) => {
    return status === "Active" ? "default" : "secondary"
  }

  const getAccessLevelBadgeVariant = (level: string) => {
    switch (level) {
      case "Full": return "destructive"
      case "Moderate": return "default"
      case "Limited": return "secondary"
      default: return "outline"
    }
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">Team Structure</h1>
          <p className="text-gray-600">Manage departments and positions across your organization</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              👥
            </div>
            <div>
              <h3 className="text-blue-900 mb-1">Building Strong Teams</h3>
              <p className="text-blue-700 text-sm">Clear structure and defined roles create successful support teams that make a difference every day.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === "departments" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("departments")}
          className="rounded-md"
        >
          Departments
        </Button>
        <Button
          variant={activeTab === "positions" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("positions")}
          className="rounded-md"
        >
          Positions
        </Button>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add {activeTab === "departments" ? "Department" : "Position"}
          </Button>
        </div>
      </div>

      {/* Departments Table */}
      {activeTab === "departments" && (
        <Card>
          <CardHeader>
            <CardTitle>Departments ({departments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Default Access Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell className="text-gray-600">{dept.description}</TableCell>
                    <TableCell>
                      <Badge variant={getAccessLevelBadgeVariant(dept.accessLevel)}>
                        {dept.accessLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(dept.status)}>
                        {dept.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
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

      {/* Positions Table */}
      {activeTab === "positions" && (
        <Card>
          <CardHeader>
            <CardTitle>Positions ({positions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Compliance Requirements</TableHead>
                  <TableHead>Access Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell className="font-medium">{position.title}</TableCell>
                    <TableCell className="text-gray-600">{position.department}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {position.complianceReqs.slice(0, 2).map((req, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                        {position.complianceReqs.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{position.complianceReqs.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getAccessLevelBadgeVariant(position.accessLevel)}>
                        {position.accessLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(position.status)}>
                        {position.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
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
    </div>
  )
}