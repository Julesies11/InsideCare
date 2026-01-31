import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Badge } from "./ui/badge"
import { Plus, Search, Filter, Download, Edit, Eye, Network, Phone, Mail } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

export function ProvidersDirectory() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const providers = [
    {
      id: 1,
      name: "Dr. Sarah Mitchell",
      company: "Springfield Allied Health",
      type: "OT",
      linkedClients: 8,
      phone: "(03) 9123 4567",
      email: "s.mitchell@springfieldhealth.com.au",
      status: "Active",
      specialties: ["Sensory Processing", "Daily Living Skills"]
    },
    {
      id: 2,
      name: "Michael Thompson",
      company: "Mindful Psychology Services",
      type: "Psychologist",
      linkedClients: 12,
      phone: "(03) 9234 5678",
      email: "m.thompson@mindfulpsych.com.au",
      status: "Active",
      specialties: ["Behaviour Support", "Autism Spectrum"]
    },
    {
      id: 3,
      name: "Dr. Emma Chen",
      company: "Springfield Medical Centre",
      type: "GP",
      linkedClients: 15,
      phone: "(03) 9345 6789",
      email: "e.chen@springfieldmedical.com.au",
      status: "Active",
      specialties: ["General Practice", "Disability Health"]
    },
    {
      id: 4,
      name: "Lisa Rodriguez",
      company: "Communication Plus",
      type: "Speech Pathologist",
      linkedClients: 6,
      phone: "(03) 9456 7890",
      email: "l.rodriguez@commplus.com.au",
      status: "Active",
      specialties: ["AAC", "Swallowing Assessment"]
    },
    {
      id: 5,
      name: "David Park",
      company: "Nutrition Solutions",
      type: "Dietitian",
      linkedClients: 4,
      phone: "(03) 9567 8901",
      email: "d.park@nutritionsolutions.com.au",
      status: "Active",
      specialties: ["Disability Nutrition", "Meal Planning"]
    },
    {
      id: 6,
      name: "Jennifer Williams",
      company: "Active Physiotherapy",
      type: "Physiotherapist",
      linkedClients: 0,
      phone: "(03) 9678 9012",
      email: "j.williams@activephysio.com.au",
      status: "Inactive",
      specialties: ["Mobility", "Exercise Prescription"]
    }
  ]

  const getStatusBadgeVariant = (status: string) => {
    return status === "Active" ? "default" : "secondary"
  }

  const getTypeBadgeVariant = (type: string) => {
    const typeColors = {
      "OT": "destructive",
      "Psychologist": "default",
      "GP": "secondary",
      "Speech Pathologist": "outline",
      "Dietitian": "default",
      "Physiotherapist": "secondary"
    }
    return typeColors[type as keyof typeof typeColors] || "outline"
  }

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterType === "all" || provider.type === filterType
    const matchesStatus = filterStatus === "all" || provider.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  const uniqueTypes = [...new Set(providers.map(p => p.type))]

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">Providers Directory</h1>
          <p className="text-gray-600">Manage external healthcare and support providers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Provider
          </Button>
        </div>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <Network className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-indigo-900 mb-1">Connected Care Network</h3>
              <p className="text-indigo-700 text-sm">Strong partnerships with quality providers ensure participants receive comprehensive, coordinated care.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search providers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Provider Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
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
              <div className="text-2xl font-medium text-blue-600">{providers.filter(p => p.status === "Active").length}</div>
              <div className="text-sm text-gray-600">Active Providers</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-green-600">{uniqueTypes.length}</div>
              <div className="text-sm text-gray-600">Provider Types</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-purple-600">{providers.reduce((sum, p) => sum + p.linkedClients, 0)}</div>
              <div className="text-sm text-gray-600">Total Connections</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-orange-600">
                {Math.round(providers.reduce((sum, p) => sum + p.linkedClients, 0) / providers.filter(p => p.status === "Active").length)}
              </div>
              <div className="text-sm text-gray-600">Avg Clients per Provider</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Providers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Providers ({filteredProviders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Linked Clients</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProviders.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-sm text-gray-500">{provider.company}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {provider.specialties.slice(0, 2).map((specialty, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                        {provider.specialties.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{provider.specialties.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeBadgeVariant(provider.type)}>
                      {provider.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{provider.linkedClients} clients</span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="h-3 w-3" />
                        {provider.phone}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="h-3 w-3" />
                        {provider.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(provider.status)}>
                      {provider.status}
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