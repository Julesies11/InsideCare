import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  DollarSign, 
  User, 
  FileText, 
  Download, 
  AlertCircle, 
  TrendingUp, 
  PieChart, 
  Calendar, 
  CreditCard 
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

// Mock data for funding records
const fundingRecords = [
  {
    id: 1,
    participantName: "Sarah Johnson",
    fundingSource: "NDIS",
    type: "Core Supports",
    registrationNumber: "NDIS-2024-001-CORE",
    invoiceRecipient: "Sarah Johnson",
    allocated: 45000,
    used: 32500,
    remaining: 12500,
    status: "Active",
    expiryDate: "2024-12-31"
  },
  {
    id: 2,
    participantName: "Sarah Johnson",
    fundingSource: "NDIS",
    type: "Capacity Building",
    registrationNumber: "NDIS-2024-001-CB",
    invoiceRecipient: "Sarah Johnson",
    allocated: 15000,
    used: 8200,
    remaining: 6800,
    status: "Active",
    expiryDate: "2024-12-31"
  },
  {
    id: 3,
    participantName: "Michael Chen",
    fundingSource: "NDIS",
    type: "Core Supports",
    registrationNumber: "NDIS-2024-002-CORE",
    invoiceRecipient: "Linda Chen (Plan Manager)",
    allocated: 52000,
    used: 41200,
    remaining: 10800,
    status: "Active",
    expiryDate: "2024-11-30"
  },
  {
    id: 4,
    participantName: "Emma Williams",
    fundingSource: "Private",
    type: "Support Services",
    registrationNumber: "PVT-2024-003",
    invoiceRecipient: "Williams Family Trust",
    allocated: 25000,
    used: 18750,
    remaining: 6250,
    status: "Active",
    expiryDate: "2024-10-31"
  },
  {
    id: 5,
    participantName: "David Rodriguez",
    fundingSource: "NDIS",
    type: "Capital Supports",
    registrationNumber: "NDIS-2024-004-CAP",
    invoiceRecipient: "David Rodriguez",
    allocated: 8000,
    used: 7500,
    remaining: 500,
    status: "Near Depletion",
    expiryDate: "2024-09-30"
  }
]

// Mock detailed funding data
const fundingDetail = {
  participantName: "Sarah Johnson",
  totalAllocated: 60000,
  totalUsed: 40700,
  totalRemaining: 19300,
  categories: [
    {
      name: "Assistance with Daily Living",
      allocated: 25000,
      used: 18500,
      remaining: 6500,
      claims: [
        { date: "2024-01-15", amount: 450, description: "Personal care support", status: "Paid" },
        { date: "2024-01-08", amount: 380, description: "Domestic assistance", status: "Paid" },
        { date: "2024-01-01", amount: 420, description: "Meal preparation", status: "Pending" }
      ]
    },
    {
      name: "Transport",
      allocated: 8000,
      used: 5200,
      remaining: 2800,
      claims: [
        { date: "2024-01-18", amount: 65, description: "Community access transport", status: "Paid" },
        { date: "2024-01-12", amount: 45, description: "Medical appointment transport", status: "Paid" }
      ]
    },
    {
      name: "Social and Community Participation",
      allocated: 12000,
      used: 8800,
      remaining: 3200,
      claims: [
        { date: "2024-01-20", amount: 120, description: "Community group activity", status: "Paid" },
        { date: "2024-01-14", amount: 95, description: "Social skills development", status: "Paid" }
      ]
    }
  ],
  invoices: [
    { id: "INV-2024-001", date: "2024-01-15", amount: 1250, status: "Paid", dueDate: "2024-01-30" },
    { id: "INV-2024-002", date: "2024-01-08", amount: 980, status: "Paid", dueDate: "2024-01-23" },
    { id: "INV-2024-003", date: "2024-01-01", amount: 1420, status: "Pending", dueDate: "2024-01-16" }
  ]
}

export function Funding() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const filteredRecords = fundingRecords.filter(record => {
    const matchesSearch = record.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSource = sourceFilter === "all" || record.fundingSource === sourceFilter
    const matchesType = typeFilter === "all" || record.type === typeFilter
    const matchesStatus = statusFilter === "all" || record.status === statusFilter
    
    return matchesSearch && matchesSource && matchesType && matchesStatus
  })

  const viewDetail = (participant: string) => {
    setSelectedParticipant(participant)
    setShowDetailDialog(true)
  }

  const getUsagePercentage = (used: number, allocated: number) => {
    return Math.round((used / allocated) * 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "default"
      case "Near Depletion": return "destructive"
      case "Expired": return "secondary"
      default: return "default"
    }
  }

  const FundingDetailDialog = () => (
    <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Funding Details - {selectedParticipant}</DialogTitle>
          <DialogDescription>
            View comprehensive funding breakdown, invoices, and budget utilization details.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Allocated</p>
                    <p className="text-xl">${fundingDetail.totalAllocated.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Used</p>
                    <p className="text-xl">${fundingDetail.totalUsed.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className="text-xl">${fundingDetail.totalRemaining.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="breakdown" className="w-full">
            <TabsList>
              <TabsTrigger value="breakdown">Category Breakdown</TabsTrigger>
              <TabsTrigger value="invoices">Linked Invoices</TabsTrigger>
              <TabsTrigger value="claims">Claim History</TabsTrigger>
              <TabsTrigger value="reminders">Review Reminders</TabsTrigger>
            </TabsList>

            <TabsContent value="breakdown" className="space-y-4">
              {fundingDetail.categories.map((category, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Used: ${category.used.toLocaleString()}</span>
                        <span>Remaining: ${category.remaining.toLocaleString()}</span>
                      </div>
                      <Progress value={getUsagePercentage(category.used, category.allocated)} />
                      <div className="text-xs text-muted-foreground">
                        {getUsagePercentage(category.used, category.allocated)}% of ${category.allocated.toLocaleString()} allocated
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="invoices">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fundingDetail.invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>{invoice.id}</TableCell>
                          <TableCell>{invoice.date}</TableCell>
                          <TableCell>${invoice.amount.toLocaleString()}</TableCell>
                          <TableCell>{invoice.dueDate}</TableCell>
                          <TableCell>
                            <Badge variant={invoice.status === "Paid" ? "default" : "secondary"}>
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="claims">
              <div className="space-y-4">
                {fundingDetail.categories.map((category, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {category.claims.map((claim, claimIndex) => (
                            <TableRow key={claimIndex}>
                              <TableCell>{claim.date}</TableCell>
                              <TableCell>{claim.description}</TableCell>
                              <TableCell>${claim.amount}</TableCell>
                              <TableCell>
                                <Badge variant={claim.status === "Paid" ? "default" : "secondary"}>
                                  {claim.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reminders">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 border border-orange-200 rounded-lg bg-orange-50">
                      <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <h4 className="text-orange-900">Plan Review Due</h4>
                        <p className="text-sm text-orange-700">
                          NDIS plan review is due in 45 days. Schedule review meeting.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-4 border border-red-200 rounded-lg bg-red-50">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="text-red-900">Low Funding Alert</h4>
                        <p className="text-sm text-red-700">
                          Capital Supports funding is at 94% utilization. Consider budget reallocation.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )

  const AddFundingDialog = () => (
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Funding Record</DialogTitle>
          <DialogDescription>
            Create a new funding record for a participant with budget allocation details.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Participant</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select participant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sarah">Sarah Johnson</SelectItem>
                  <SelectItem value="michael">Michael Chen</SelectItem>
                  <SelectItem value="emma">Emma Williams</SelectItem>
                  <SelectItem value="david">David Rodriguez</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Funding Source</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ndis">NDIS</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="state">State Funding</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Funding Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="core">Core Supports</SelectItem>
                  <SelectItem value="capacity">Capacity Building</SelectItem>
                  <SelectItem value="capital">Capital Supports</SelectItem>
                  <SelectItem value="support">Support Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Registration Number</label>
              <Input placeholder="Enter registration number" />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Invoice Recipient</label>
            <Input placeholder="Enter invoice recipient" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Allocated Amount</label>
              <Input type="number" placeholder="0.00" />
            </div>
            
            <div>
              <label className="text-sm font-medium">Expiry Date</label>
              <Input type="date" />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowAddDialog(false)}>
              Add Funding Record
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1>Funding Overview</h1>
          <p className="text-muted-foreground">Manage participant funding records and budgets</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Funding Record
          </Button>
        </div>
      </div>

      {/* Motivational Banner */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-purple-900">Maximizing Every Dollar</h3>
              <p className="text-purple-700">
                Strategic funding management ensures that every participant receives the support they need to thrive. 
                Your careful oversight makes their dreams achievable and sustainable.
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
                placeholder="Search participants or registration..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Funding Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="NDIS">NDIS</SelectItem>
                <SelectItem value="Private">Private</SelectItem>
                <SelectItem value="State">State Funding</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Funding Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Core Supports">Core Supports</SelectItem>
                <SelectItem value="Capacity Building">Capacity Building</SelectItem>
                <SelectItem value="Capital Supports">Capital Supports</SelectItem>
                <SelectItem value="Support Services">Support Services</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Near Depletion">Near Depletion</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Funding Records Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead>Funding Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Registration Number</TableHead>
                <TableHead>Invoice Recipient</TableHead>
                <TableHead>Budget Summary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {record.participantName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{record.fundingSource}</Badge>
                  </TableCell>
                  <TableCell>{record.type}</TableCell>
                  <TableCell className="font-mono text-sm">{record.registrationNumber}</TableCell>
                  <TableCell>{record.invoiceRecipient}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Used: ${record.used.toLocaleString()}</span>
                        <span>Remaining: ${record.remaining.toLocaleString()}</span>
                      </div>
                      <Progress value={getUsagePercentage(record.used, record.allocated)} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        ${record.allocated.toLocaleString()} allocated
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(record.status)}>
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => viewDetail(record.participantName)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <FundingDetailDialog />
      <AddFundingDialog />
    </div>
  )
}