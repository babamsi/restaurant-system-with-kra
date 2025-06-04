"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Camera, FileText, Upload } from "lucide-react"

export function ReceiptUploader() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [extractedItems, setExtractedItems] = useState<
    Array<{ name: string; quantity: number; unit: string; cost: number }>
  >([])

  // Simulate OCR extraction
  const handleUpload = () => {
    // In a real app, this would be an API call to an OCR service
    setUploadedImage("/paper-receipt.png")

    // Simulated extracted data
    setExtractedItems([
      { name: "Fresh Tomatoes", quantity: 10, unit: "kg", cost: 25.0 },
      { name: "Onions", quantity: 5, unit: "kg", cost: 7.5 },
      { name: "Bell Peppers", quantity: 3, unit: "kg", cost: 9.0 },
      { name: "Garlic", quantity: 2, unit: "kg", cost: 8.0 },
    ])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receipt OCR</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!uploadedImage ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Upload a supplier receipt to automatically extract items
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" onClick={handleUpload}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                    <Button variant="outline" onClick={handleUpload}>
                      <Camera className="h-4 w-4 mr-2" />
                      Take Photo
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-1/3">
                  <p className="text-sm font-medium mb-2">Uploaded Receipt</p>
                  <div className="border rounded-lg overflow-hidden">
                    <Image
                      src={uploadedImage || "/placeholder.svg"}
                      alt="Receipt"
                      width={200}
                      height={300}
                      className="w-full object-contain"
                    />
                  </div>
                </div>
                <div className="w-2/3">
                  <p className="text-sm font-medium mb-2">Extracted Items</p>
                  <div className="border rounded-lg p-4">
                    <div className="space-y-4">
                      {extractedItems.map((item, index) => (
                        <div key={index}>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`item-${index}`}>Item Name</Label>
                              <Input id={`item-${index}`} defaultValue={item.name} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-2">
                                <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                                <Input id={`quantity-${index}`} type="number" defaultValue={item.quantity} />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`unit-${index}`}>Unit</Label>
                                <Input id={`unit-${index}`} defaultValue={item.unit} />
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="space-y-2">
                              <Label htmlFor={`cost-${index}`}>Cost</Label>
                              <Input id={`cost-${index}`} type="number" defaultValue={item.cost} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`price-${index}`}>Selling Price per Unit</Label>
                              <Input id={`price-${index}`} type="number" placeholder="0.00" />
                            </div>
                          </div>
                          {index < extractedItems.length - 1 && <Separator className="my-4" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadedImage(null)
                    setExtractedItems([])
                  }}
                >
                  Cancel
                </Button>
                <Button>Add to Inventory</Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
