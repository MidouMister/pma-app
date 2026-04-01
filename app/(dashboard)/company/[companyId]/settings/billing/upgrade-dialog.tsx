"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { formatCurrency } from "@/lib/format"

interface PlanShape {
  id: string
  name: string
  priceDA: number
}

interface UpgradeDialogProps {
  plans: PlanShape[]
}

export function UpgradeDialog({ plans }: UpgradeDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [contactInfo, setContactInfo] = useState("")

  const availablePlans = plans.filter((p) => p.name !== "Starter")

  const handleSubmit = () => {
    // TODO: SUB-04 — submit upgrade request to server action
    setSubmitted(true)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setSubmitted(false)
      setSelectedPlan("")
      setPaymentMethod("")
      setContactInfo("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default">Demander une mise à niveau</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        {!submitted ? (
          <>
            <DialogHeader>
              <DialogTitle>Mise à niveau de l&apos;abonnement</DialogTitle>
              <DialogDescription>
                Sélectionnez un plan et un moyen de paiement. Notre équipe vous
                contactera pour finaliser la mise à niveau.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-6 py-4">
              {/* Plan picker */}
              <div className="flex flex-col gap-2">
                <Label>Plan souhaité</Label>
                <RadioGroup
                  value={selectedPlan}
                  onValueChange={setSelectedPlan}
                  className="flex flex-col gap-3"
                >
                  {availablePlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={plan.id} id={plan.id} />
                        <Label
                          htmlFor={plan.id}
                          className="cursor-pointer font-medium"
                        >
                          {plan.name}
                        </Label>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(plan.priceDA)}
                        /mois
                      </span>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Payment method */}
              <div className="flex flex-col gap-2">
                <Label>Moyen de paiement</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un moyen de paiement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">
                      Virement bancaire
                    </SelectItem>
                    <SelectItem value="check">Chèque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Contact info */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="contact">
                  Coordonnées (email ou téléphone)
                </Label>
                <Input
                  id="contact"
                  placeholder="contact@entreprise.dz"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!selectedPlan || !paymentMethod || !contactInfo}
                className="mt-2"
              >
                Envoyer la demande
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Demande envoyée</DialogTitle>
              <DialogDescription>
                Votre demande de mise à niveau a été enregistrée. Notre équipe
                vous contactera dans les plus brefs délais pour finaliser
                l&apos;opération.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end pt-4">
              <Button onClick={() => setOpen(false)}>Fermer</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
