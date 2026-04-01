"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Trash2 } from "lucide-react"

interface ProjectDocumentsProps {
  projectId: string
  companyId: string
}

interface UploadedFile {
  name: string
  size: number
  url: string
  uploadedAt: Date
}

export function ProjectDocuments({
  projectId: _projectId,
  companyId: _companyId,
}: ProjectDocumentsProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    const newFiles: UploadedFile[] = Array.from(selectedFiles).map((file) => ({
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
      uploadedAt: new Date(),
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " o"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " Ko"
    return (bytes / (1024 * 1024)).toFixed(1) + " Mo"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents du projet</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Les documents seront sauvegardés dans une future mise à jour.
          </p>

          <div className="flex items-center gap-2">
            <label>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
              >
                <Upload className="mr-2 h-4 w-4" />
                Ajouter des fichiers
              </Button>
            </label>
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium">Fichiers</h4>
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 truncate text-sm">{file.name}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(file.size)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFile(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
