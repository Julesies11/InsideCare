import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Badge } from "./ui/badge"
import { Plus, Search, Filter, Download, Edit, Eye, FormInput, Type, ChevronDown, CheckSquare, ToggleLeft } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

export function FormBuilder() {
  const [activeTab, setActiveTab] = useState("tiles")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")

  const formTiles = [
    {
      id: 1,
      category: "Input",
      type: "Text",
      name: "Short Text Input",
      required: true,
      access: "All Staff",
      icon: Type,
      description: "Single line text input for names, addresses, etc."
    },
    {
      id: 2,
      category: "Input",
      type: "Dropdown",
      name: "Service Type Selector",
      required: false,
      access: "House Managers",
      icon: ChevronDown,
      description: "Predefined list of available services"
    },
    {
      id: 3,
      category: "Input",
      type: "Checkbox",
      name: "Medication Checklist",
      required: true,
      access: "Support Workers",
      icon: CheckSquare,
      description: "Multiple selection for medication types"
    },
    {
      id: 4,
      category: "Input",
      type: "Truth Value",
      name: "Yes/No Response",
      required: false,
      access: "All Staff",
      icon: ToggleLeft,
      description: "Simple true/false or yes/no questions"
    },
    {
      id: 5,
      category: "Assessment",
      type: "Text",
      name: "Incident Description",
      required: true,
      access: "All Staff",
      icon: Type,
      description: "Long text area for detailed descriptions"
    },
    {
      id: 6,
      category: "Assessment",
      type: "Dropdown",
      name: "Risk Level",
      required: true,
      access: "House Managers",
      icon: ChevronDown,
      description: "Risk assessment levels (Low, Medium, High, Critical)"
    },
    {
      id: 7,
      category: "Compliance",
      type: "Checkbox",
      name: "Training Completed",
      required: true,
      access: "Admin",
      icon: CheckSquare,
      description: "Training module completion checklist"
    },
    {
      id: 8,
      category: "Compliance",
      type: "Truth Value",
      name: "Policy Acknowledged",
      required: true,
      access: "All Staff",
      icon: ToggleLeft,
      description: "Policy acknowledgment and understanding"
    }
  ]

  const savedForms = [
    {
      id: 1,
      title: "Daily Care Log",
      type: "Assessment",
      responsible: "Support Workers",
      reviewDue: "2024-12-31",
      access: "All Staff",
      lastModified: "2024-09-15",
      status: "Active"
    },
    {
      id: 2,
      title: "Incident Report Form",
      type: "Incident",
      responsible: "House Managers",
      reviewDue: "2024-11-30",
      access: "All Staff",
      lastModified: "2024-09-10",
      status: "Active"
    },
    {
      id: 3,
      title: "Medication Administration",
      type: "Medical",
      responsible: "Support Workers",
      reviewDue: "2024-10-15",
      access: "Support Workers",
      lastModified: "2024-08-20",
      status: "Active"
    },
    {
      id: 4,
      title: "Training Completion Record",
      type: "Compliance",
      responsible: "Admin",
      reviewDue: "2024-12-01",
      access: "Admin",
      lastModified: "2024-07-12",
      status: "Draft"
    },
    {
      id: 5,
      title: "Risk Assessment Form",
      type: "Assessment",
      responsible: "House Managers",
      reviewDue: "2024-11-15",
      access: "House Managers",
      lastModified: "2024-09-05",
      status: "Active"
    },
    {
      id: 6,
      title: "Client Feedback Survey",
      type: "Feedback",
      responsible: "Support Coordinators",
      reviewDue: "2024-10-30",
      access: "All Staff",
      lastModified: "2024-06-18",
      status: "Inactive"
    }
  ]

  const getAccessBadgeVariant = (access: string) => {
    switch (access) {
      case "All Staff": return "default"
      case "House Managers": return "destructive"
      case "Support Workers": return "secondary"
      case "Admin": return "outline"
      default: return "outline"
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Active": return "default"
      case "Draft": return "outline"
      case "Inactive": return "secondary"
      default: return "outline"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Input": return "📝"
      case "Assessment": return "📊"
      case "Compliance": return "✅"
      case "Medical": return "🏥"
      case "Incident": return "⚠️"
      case "Feedback": return "💬"
      default: return "📄"
    }
  }

  const filteredTiles = formTiles.filter(tile => {
    const matchesSearch = tile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tile.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || tile.category === filterCategory
    
    return matchesSearch && matchesCategory
  })

  const filteredForms = savedForms.filter(form => {
    const matchesSearch = form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         form.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || form.type === filterCategory
    
    return matchesSearch && matchesCategory
  })

  const uniqueCategories = [...new Set([...formTiles.map(t => t.category), ...savedForms.map(f => f.type)])]

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">Form Builder</h1>
          <p className="text-gray-600">Create and manage custom forms using reusable components</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create New Form
          </Button>
        </div>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <FormInput className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-yellow-900 mb-1">Streamlined Documentation</h3>
              <p className="text-yellow-700 text-sm">Custom forms help capture exactly the information we need to provide the best possible care.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === "tiles" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("tiles")}
          className="rounded-md"
        >
          Tile Library
        </Button>
        <Button
          variant={activeTab === "forms" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("forms")}
          className="rounded-md"
        >
          Templates & Forms
        </Button>
      </div>

      {/* Search and Filters */}
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
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tile Library */}
      {activeTab === "tiles" && (
        <Card>
          <CardHeader>
            <CardTitle>Reusable Form Tiles ({filteredTiles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTiles.map((tile) => {
                  const IconComponent = tile.icon
                  return (
                    <TableRow key={tile.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCategoryIcon(tile.category)}</span>
                          <span className="font-medium">{tile.category}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4 text-gray-600" />
                          <Badge variant="outline" className="text-xs">
                            {tile.type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{tile.name}</TableCell>
                      <TableCell>
                        <Badge variant={tile.required ? "destructive" : "secondary"}>
                          {tile.required ? "Required" : "Optional"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getAccessBadgeVariant(tile.access)}>
                          {tile.access}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs">
                        {tile.description}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Templates & Saved Forms */}
      {activeTab === "forms" && (
        <Card>
          <CardHeader>
            <CardTitle>Templates & Saved Forms ({filteredForms.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Responsible</TableHead>
                  <TableHead>Review Due</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredForms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{form.title}</div>
                        <div className="text-sm text-gray-500">Modified: {form.lastModified}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCategoryIcon(form.type)}</span>
                        <Badge variant="outline" className="text-xs">
                          {form.type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{form.responsible}</TableCell>
                    <TableCell>
                      <span className="text-sm">{form.reviewDue}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getAccessBadgeVariant(form.access)}>
                        {form.access}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(form.status)}>
                        {form.status}
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-blue-600">{formTiles.length}</div>
              <div className="text-sm text-gray-600">Available Tiles</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-green-600">
                {savedForms.filter(f => f.status === "Active").length}
              </div>
              <div className="text-sm text-gray-600">Active Forms</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-orange-600">
                {savedForms.filter(f => f.status === "Draft").length}
              </div>
              <div className="text-sm text-gray-600">Draft Forms</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-medium text-purple-600">{uniqueCategories.length}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}