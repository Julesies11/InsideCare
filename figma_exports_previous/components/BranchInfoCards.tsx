import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Building, Phone, Mail, Edit3 } from "lucide-react"
import { Button } from "./ui/button"

export function BranchInfoCards() {
  return (
    <div className="grid lg:grid-cols-3 gap-6 mb-6">
      {/* Company Name Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="h-5 w-5 text-blue-600" />
            </div>
            🏠 SIL Care PTY Ltd
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Supporting Independent Living services provider dedicated to empowering individuals in their daily lives.</p>
        </CardContent>
      </Card>

      {/* Contact Details Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Phone className="h-5 w-5 text-green-600" />
            </div>
            📞 Contact Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-500" />
            <span className="text-sm">04x xxx xxxx</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <span className="text-sm">xxxx@silcare.net.au</span>
          </div>
        </CardContent>
      </Card>

      {/* Overview Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Edit3 className="h-5 w-5 text-purple-600" />
              </div>
              📋 Overview
            </div>
            <Button variant="outline" size="sm">
              <Edit3 className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="branch-name">Branch Name</Label>
            <Input 
              id="branch-name" 
              value="SIL Care Pty Ltd" 
              readOnly 
              className="bg-gray-50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input 
              id="address" 
              value="111 Somewhere St, 0000 Anywhere" 
              readOnly 
              className="bg-gray-50"
            />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                value="04x xxx xxxx" 
                readOnly 
                className="bg-gray-50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              value="xxxx@silcare.net.au" 
              readOnly 
              className="bg-gray-50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manager">Manager's Name</Label>
            <Input 
              id="manager" 
              value="Someone Anybody" 
              readOnly 
              className="bg-gray-50"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}