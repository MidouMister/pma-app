"use client"

import { type FC, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { submitUpgradeRequest } from "@/actions/subscription"
import { ArrowUpRight, Loader2, CheckCircle2 } from "lucide-react"

interface UpgradeRequestDialogProps {
  companyId: string
  currentPlan: string
}

export const UpgradeRequestDialog: FC<UpgradeRequestDialogProps> = ({
  companyId,
  currentPlan,
}) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    plan: currentPlan === "Starter" ? "Pro" : "Premium",
    paymentMethod: "cheque",
    phone: "",
    email: "",
    notes: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const availablePlans =
    currentPlan === "Starter"
      ? [
          { value: "Pro", label: "Pro", price: "Sur devis" },
          { value: "Premium", label: "Premium", price: "Sur devis" },
        ]
      : [{ value: "Premium", label: "Premium", price: "Sur devis" }]

  function handleSubmit() {
    const newErrors: Record<string, string> = {}

    if (!formData.phone.trim()) {
      newErrors.phone = "Le numéro de téléphone est requis"
    }
    if (!formData.email.trim()) {
      newErrors.email = "L'adresse email est requise"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    startTransition(async () => {
      try {
        await submitUpgradeRequest({
          companyId,
          targetPlan: formData.plan,
          paymentMethod: formData.paymentMethod,
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          notes: formData.notes.trim() || undefined,
        })
        setSubmitted(true)
        router.refresh()
      } catch {
        setErrors({
          form: "Une erreur est survenue. Veuillez réessayer.",
        })
      }
    })
  }

  function handleOpenChange(value: boolean) {
    setOpen(value)
    if (!value) {
      setTimeout(() => {
        setSubmitted(false)
        setErrors({})
      }, 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <ArrowUpRight className="h-4 w-4" />
          Demander une mise à niveau
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        {submitted ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Demande envoyée
              </DialogTitle>
              <DialogDescription>
                Votre demande de mise à niveau a été enregistrée avec succès.
                Notre équipe vous contactera dans les plus brefs délais pour
                finaliser le paiement.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Fermer</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Demander une mise à niveau</DialogTitle>
              <DialogDescription>
                Remplissez ce formulaire pour demander une mise à niveau de
                votre plan. Le paiement s&apos;effectue par chèque ou virement
                bancaire.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              {errors.form && (
                <p className="text-sm text-destructive">{errors.form}</p>
              )}

              {/* Plan Selection */}
              <div className="flex flex-col gap-2">
                <Label>Plan souhaité</Label>
                <RadioGroup
                  value={formData.plan}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, plan: value }))
                  }
                  className="flex flex-col gap-2"
                >
                  {availablePlans.map((plan) => (
                    <div
                      key={plan.value}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem
                          value={plan.value}
                          id={`plan-${plan.value}`}
                        />
                        <Label
                          htmlFor={`plan-${plan.value}`}
                          className="cursor-pointer font-medium"
                        >
                          {plan.label}
                        </Label>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {plan.price}
                      </span>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Payment Method */}
              <div className="flex flex-col gap-2">
                <Label>Mode de paiement préféré</Label>
                <RadioGroup
                  value={formData.paymentMethod}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, paymentMethod: value }))
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="cheque" id="pay-cheque" />
                    <Label htmlFor="pay-cheque" className="cursor-pointer">
                      Chèque
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="virement" id="pay-virement" />
                    <Label htmlFor="pay-virement" className="cursor-pointer">
                      Virement bancaire
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Contact Info */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0555 12 34 56"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email de contact</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@entreprise.dz"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  placeholder="Informations supplémentaires..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Envoyer la demande
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
