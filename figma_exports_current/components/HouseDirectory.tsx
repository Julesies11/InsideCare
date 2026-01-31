import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Badge } from "./ui/badge"
import { Plus, Search, Filter, Download, Edit, Eye, MapPin, Home } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

export function HouseDirectory() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const houses = [
    {
      id: 1,
      name: "Sunshine House",
      address: "123 Maple Street, Springfield",
      linkedClients: 4,
      linkedStaff: 8,
      capacity: 4,
      status: "Active",
      manager: "Sarah Johnson",
      type: "SIL"
    },
    {
      id: 2,
      name: "Garden View Residence",
      address: "456 Oak Avenue, Springfield",
      linkedClients: 3,
      linkedStaff: 6,
      capacity: 4,
      status: "Active",
      manager: "Michael Chen",
      type: "SIL"
    },
    {
      id: 3,
      name: "Riverside Villa",
      address: "789 River Road, Springfield",
      linkedClients: 2,
      linkedStaff: 5,
      capacity: 3,
      status: "Active",
      manager: "Emma Davis",
      type: "SIL"
    },
    {
      id: 4,
      name: "Harmony Lodge",
      address: "321 Pine Street, Springfield",
      linkedClients: 0,
      linkedStaff: 2,
      capacity: 3,
      status: "Inactive",
      manager: "David Wilson",
      type: "SIL"
    },
    {
      id: 5,
      name: "Community Hub",
      address: "654 Main Street, Springfield",
      linkedClients: 15,
      linkedStaff: 12,
      capacity: 20,
      status: "Active",
      manager: "Lisa Anderson",
      type: "Community"
    }
  ]

  const getStatusBadgeVariant = (status: string) => {
    return status === "Active" ? "default" : "secondary"
  }

  const getTypeBadgeVariant = (type: string) => {
    return type === "SIL" ? "destructive" : "outline"
  }

  const getOccupancyColor = (clients: number, capacity: number) => {
    const percentage = (clients / capacity) * 100
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 70) return "text-orange-600"
    return "text-green-600"
  }

  const filteredHouses = houses.filter(house => {
    const matchesSearch = house.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         house.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         house.manager.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || house.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">House Directory</h1>
          <p className="text-gray-600">Manage residential properties and accommodation services</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add New House
          </Button>
        </div>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Home className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-orange-900 mb-1">Creating Safe Homes</h3>
              <p className="text-orange-700 text-sm">Every house in our network is more than accommodation – it's a home where independence flourishes.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search houses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
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
              <div className="text-2xl font-medium text-blue-600">{houses.filter(h => h.status === "Active").length}</div>
              <div className="text-sm text-gray-600">Active Houses</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-green-600">{houses.reduce((sum, h) => sum + h.linkedClients, 0)}</div>
              <div className="text-sm text-gray-600">Total Residents</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-purple-600">{houses.reduce((sum, h) => sum + h.capacity, 0)}</div>
              <div className="text-sm text-gray-600">Total Capacity</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-orange-600">
                {Math.round((houses.reduce((sum, h) => sum + h.linkedClients, 0) / houses.reduce((sum, h) => sum + h.capacity, 0)) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Occupancy Rate</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Houses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Houses ({filteredHouses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>House Name</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Occupancy</TableHead>
                <TableHead>Linked Staff</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHouses.map((house) => (
                <TableRow key={house.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{house.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {house.address}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{house.manager}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`${getOccupancyColor(house.linkedClients, house.capacity)}`}>
                        {house.linkedClients}/{house.capacity}
                      </span>
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-current rounded-full transition-all"
                          style={{ 
                            width: `${(house.linkedClients / house.capacity) * 100}%`,
                            backgroundColor: house.linkedClients / house.capacity >= 0.9 ? '#dc2626' : 
                                           house.linkedClients / house.capacity >= 0.7 ? '#ea580c' : '#16a34a'
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{house.linkedStaff} staff</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeBadgeVariant(house.type)}>
                      {house.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(house.status)}>
                      {house.status}
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