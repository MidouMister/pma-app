"use client"

import { useState, useCallback } from "react"
import { Target } from "lucide-react"
import { FormModal } from "@/components/shared/form-modal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { createProduct, updateProduct } from "@/actions/production"
import { formatCurrency } from "@/lib/format"

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  phaseId: string
  phaseMontantHT: number
  product?: { id: string; taux: number; date: Date } | null
  onSuccess?: () => void
}

export function ProductForm({
  open,
  onOpenChange,
  phaseId,
  phaseMontantHT,
  product,
  onSuccess,
}: ProductFormProps) {
  const [taux, setTaux] = useState(product?.taux ?? 0)
  const [date, setDate] = useState(
    product?.date ? toDateInputValue(product.date) : ""
  )
  const [isPending, setIsPending] = useState(false)

  const montantProd = phaseMontantHT * (taux / 100)

  function resetForm() {
    setTaux(product?.taux ?? 0)
    setDate(product?.date ? toDateInputValue(product.date) : "")
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsPending(true)

      try {
        if (product) {
          const result = await updateProduct({
            id: product.id,
            taux,
            date: new Date(date),
          })
          if (!result.success) throw new Error(result.error)
        } else {
          const result = await createProduct({
            phaseId,
            taux,
            date: new Date(date),
          })
          if (!result.success) throw new Error(result.error)
        }
        onSuccess?.()
        onOpenChange(false)
      } catch (err) {
        console.error(err)
      } finally {
        setIsPending(false)
      }
    },
    [product, taux, date, phaseId, onSuccess, onOpenChange]
  )

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={product ? "Modifier le plan" : "Plan de production"}
      description={
        product
          ? "Modifiez les paramètres du plan de production"
          : "Définissez le plan de production pour cette phase"
      }
      icon={<Target className="size-5" />}
      size="sm"
      isPending={isPending}
      onSubmit={handleSubmit}
      onReset={resetForm}
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <span className="text-muted-foreground">Budget phase : </span>
          <span className="font-medium">{formatCurrency(phaseMontantHT)}</span>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="taux">Taux (%)</Label>
          <div className="relative">
            <Input
              id="taux"
              type="number"
              min={0}
              max={100}
              value={taux || ""}
              onChange={(e) => setTaux(Number(e.target.value))}
              className="pr-10"
              placeholder="0"
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="rounded-lg border bg-card p-3 text-sm">
          <span className="text-muted-foreground">Montant production : </span>
          <span className="font-semibold text-primary">
            {formatCurrency(montantProd)}
          </span>
        </div>
      </div>
    </FormModal>
  )
}

function toDateInputValue(date: Date): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
