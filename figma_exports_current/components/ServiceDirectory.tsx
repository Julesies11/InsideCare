import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Badge } from "./ui/badge"
import { Plus, Search, Filter, Download, Edit, Eye, BookOpen } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

export function ServiceDirectory() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const services = [
    {
      id: 1,
      name: "Daily Living Support",
      type: "SIL",
      linkedClients: 8,
      linkedStaff: 6,
      status: "Active",
      description: "Assistance with personal care, household tasks, and community participation"
    },
    {
      id: 2,
      name: "Meal Preparation & Nutrition",
      type: "SIL",
      linkedClients: 12,
      linkedStaff: 4,
      status: "Active",
      description: "Planning, shopping for, and preparing nutritious meals"
    },
    {
      id: 3,
      name: "Community Access",
      type: "Community",
      linkedClients: 15,
      linkedStaff: 8,
      status: "Active",
      description: "Support to access community activities and social opportunities"
    },
    {
      id: 4,
      name: "Transportation Support",
      type: "Community",
      linkedClients: 10,
      linkedStaff: 5,
      status: "Active",
      description: "Assistance with public transport and accompanied travel"
    },
    {
      id: 5,
      name: "Respite Care",
      type: "SIL",
      linkedClients: 6,
      linkedStaff: 8,
      status: "Active",
      description: "Short-term care services for families and carers"
    },
    {
      id: 6,
      name: "Behaviour Support",
      type: "SIL",
      linkedClients: 4,
      linkedStaff: 3,
      status: "Inactive",
      description: "Specialized support for challenging behaviours"
    }
  ]

  const getStatusBadgeVariant = (status: string) => {
    return status === "Active" ? "default" : "secondary"
  }

  const getTypeBadgeVariant = (type: string) => {
    return type === "SIL" ? "destructive" : "outline"
  }

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || service.type === filterType
    const matchesStatus = filterStatus === "all" || service.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">Service Directory</h1>
          <p className="text-gray-600">Manage and monitor all support services offered to participants</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add New Service
          </Button>
        </div>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-green-900 mb-1">Comprehensive Care Services</h3>
              <p className="text-green-700 text-sm">Every service we offer is designed to enhance independence and improve quality of life for participants.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="SIL">SIL</SelectItem>
              <SelectItem value="Community">Community</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-blue-600">{services.filter(s => s.status === "Active").length}</div>
              <div className="text-sm text-gray-600">Active Services</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-green-600">{services.filter(s => s.type === "SIL").length}</div>
              <div className="text-sm text-gray-600">SIL Services</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-purple-600">{services.filter(s => s.type === "Community").length}</div>
              <div className="text-sm text-gray-600">Community Services</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-orange-600">{services.reduce((sum, s) => sum + s.linkedClients, 0)}</div>
              <div className="text-sm text-gray-600">Total Participants</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Services ({filteredServices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Linked Clients</TableHead>
                <TableHead>Linked Staff</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{service.name}</div>
                      <div className="text-sm text-gray-500">{service.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeBadgeVariant(service.type)}>
                      {service.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{service.linkedClients} clients</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{service.linkedStaff} staff</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(service.status)}>
                      {service.status}
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
    </div>
  )
}