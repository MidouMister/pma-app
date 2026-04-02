"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { UploadButton } from "@/utils/uploadthing"
import { createDocument, deleteDocument } from "@/actions/document"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileText, Trash2, Download } from "lucide-react"

interface ProjectDocumentsProps {
  projectId: string
  companyId: string
  initialDocuments: {
    id: string
    name: string
    url: string
    size: number
    type: string
    createdAt: Date
  }[]
}

export function ProjectDocuments({
  projectId,
  companyId: _companyId,
  initialDocuments,
}: ProjectDocumentsProps) {
  const [documents, setDocuments] = useState(initialDocuments)
  const [isPending, startTransition] = useTransition()

  const handleUploadComplete = async (
    res: {
      serverData: { url: string }
      name: string
      size: number
      type: string
    }[]
  ) => {
    for (const file of res) {
      startTransition(async () => {
        const result = await createDocument({
          projectId,
          companyId: "",
          name: file.name,
          url: file.serverData.url,
          size: file.size,
          type: file.type,
        })

        if (result.success) {
          toast.success(`"${file.name}" ajouté`)
        } else {
          toast.error(result.error ?? "Erreur lors de l'ajout")
        }
      })
    }
  }

  const handleDelete = (docId: string, docName: string) => {
    startTransition(async () => {
      const result = await deleteDocument(docId)
      if (result.success) {
        toast.success(`"${docName}" supprimé`)
        setDocuments((prev) => prev.filter((d) => d.id !== docId))
      } else {
        toast.error(result.error ?? "Erreur lors de la suppression")
      }
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents du projet</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div>
            <UploadButton
              endpoint="projectDocument"
              onClientUploadComplete={handleUploadComplete}
              onUploadError={(error: Error) => {
                toast.error(`Erreur: ${error.message}`)
              }}
              content={{
                button({ ready }) {
                  if (ready) return <div>Télécharger des fichiers</div>
                  return <div>Chargement...</div>
                },
              }}
            />
          </div>

          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <FileText className="size-8 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">Aucun document</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Téléversez des PDF, images ou plans pour les associer à ce
                projet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText
                          className="size-4 text-muted-foreground"
                          data-icon="inline-start"
                        />
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {doc.name}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {doc.type}
                    </TableCell>
                    <TableCell>{formatFileSize(doc.size)}</TableCell>
                    <TableCell>{formatDate(doc.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          asChild
                        >
                          <a
                            href={doc.url}
                            download={doc.name}
                            title="Télécharger"
                          >
                            <Download
                              className="size-4"
                              data-icon="inline-start"
                            />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          onClick={() => handleDelete(doc.id, doc.name)}
                          disabled={isPending}
                          title="Supprimer"
                        >
                          <Trash2 className="size-4" data-icon="inline-start" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
