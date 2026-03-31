"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { generateUploadButton } from "@uploadthing/react"
import { updateUnit } from "@/actions/unit"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"
import type { UploadthingRouter } from "@/app/api/uploadthing/core"

const UploadButton = generateUploadButton<UploadthingRouter>()

interface UnitSettingsFormProps {
  unit: {
    id: string
    companyId: string
    name: string
    address: string
    phone: string
    email: string
    logo: string | null
  }
}

export default function UnitSettingsForm({ unit }: UnitSettingsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: unit.name,
    address: unit.address,
    phone: unit.phone,
    email: unit.email,
    logo: unit.logo ?? "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updateUnit({
        id: unit.id,
        companyId: unit.companyId,
        ...formData,
      })

      if (result.success) {
        toast.success("Unité mise à jour avec succès")
        router.refresh()
      } else {
        toast.error(result.error ?? "Erreur lors de la mise à jour")
      }
    } catch {
      toast.error("Une erreur inattendue est survenue")
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = (res: { url: string }[]) => {
    if (res?.[0]?.url) {
      setFormData((prev) => ({ ...prev, logo: res[0].url }))
      toast.success("Logo téléchargé avec succès")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations générales</CardTitle>
        <CardDescription>
          Nom, logo et coordonnées de l&apos;unité.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="size-20">
              {formData.logo ? (
                <AvatarImage src={formData.logo} alt={formData.name} />
              ) : (
                <AvatarFallback className="text-lg">
                  {formData.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <UploadButton
              endpoint="unitLogo"
              onClientUploadComplete={handleLogoUpload}
              onUploadError={() => {
                toast.error("Échec du téléchargement du logo")
              }}
              content={{
                button(ready) {
                  if (ready)
                    return (
                      <div className="flex items-center gap-2">
                        <Upload className="size-4" />
                        Changer le logo
                      </div>
                    )
                  return <div className="animate-pulse">Chargement...</div>
                },
              }}
              className="text-sm"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nom de l&apos;unité</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
