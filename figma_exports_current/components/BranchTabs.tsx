import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { FileText, Shield, FolderOpen, Upload, Calendar } from "lucide-react"
import { Button } from "./ui/button"

interface BranchTabsProps {
  onPageChange?: (page: string) => void
}

export function BranchTabs({ onPageChange }: BranchTabsProps = {}) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="policies">Policies & Plans</TabsTrigger>
        <TabsTrigger value="documents">Other Documents</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Branch Overview
            </CardTitle>
            <CardDescription>
              General information and key metrics for this branch
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Operating Hours</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Monday - Friday: 8:00 AM - 6:00 PM</p>
                  <p className="text-sm text-gray-600 mb-2">Saturday: 9:00 AM - 4:00 PM</p>
                  <p className="text-sm text-gray-600">Sunday: Emergency services only</p>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Service Areas</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">• Daily living support</p>
                  <p className="text-sm text-gray-600 mb-2">• Community participation</p>
                  <p className="text-sm text-gray-600 mb-2">• Life skills development</p>
                  <p className="text-sm text-gray-600">• 24/7 emergency support</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="policies">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Policies & Plans
            </CardTitle>
            <CardDescription>
              Branch-specific policies, procedures and compliance documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "NDIS Practice Standards", status: "Current", updated: "Dec 1, 2024" },
                { name: "Emergency Response Plan", status: "Current", updated: "Nov 15, 2024" },
                { name: "Staff Code of Conduct", status: "Review Due", updated: "Oct 1, 2024" },
                { name: "Privacy Policy", status: "Current", updated: "Nov 20, 2024" },
                { name: "Incident Management Policy", status: "Current", updated: "Dec 5, 2024" }
              ].map((policy, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{policy.name}</p>
                    <p className="text-sm text-gray-500">Last updated: {policy.updated}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      policy.status === 'Current' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {policy.status}
                    </span>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="documents">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-purple-600" />
              Other Documents
            </CardTitle>
            <CardDescription>
              Additional branch documentation and resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border-2 border-dashed border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-700">Upload new document</p>
                    <p className="text-sm text-gray-500">Drag and drop files here or click to browse</p>
                  </div>
                </div>
                <Button onClick={() => onPageChange?.('export-hub')}>Browse Files</Button>
              </div>

              {[
                { name: "Branch Registration Certificate", type: "PDF", size: "2.4 MB", date: "Nov 28, 2024" },
                { name: "Insurance Documentation", type: "PDF", size: "1.8 MB", date: "Dec 2, 2024" },
                { name: "Quality Assurance Report", type: "PDF", size: "3.2 MB", date: "Nov 10, 2024" },
                { name: "Staff Training Records", type: "Excel", size: "856 KB", date: "Dec 8, 2024" }
              ].map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <p className="text-sm text-gray-500">{doc.type} • {doc.size} • {doc.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Download</Button>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}