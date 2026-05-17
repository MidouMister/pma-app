"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { getPhaseProduction, deleteProduction } from "@/actions/production"
import { ProductForm } from "./product-form"
import { ProductionEntryForm } from "./production-entry-form"
import { ProductionCharts } from "./production-charts"
import { ProductionTable } from "./production-table"

interface ProductionTabProps {
  projectId: string
  phaseId: string
  phaseMontantHT: number
  canEdit: boolean
  productionAlertThreshold: number
}

interface ProductData {
  id: string
  taux: number
  date: Date
  montantProd: number
  Productions: Array<{
    id: string
    taux: number
    mntProd: number
    date: Date
  }>
}

export function ProductionTab({
  projectId: _projectId,
  phaseId,
  phaseMontantHT,
  canEdit,
  productionAlertThreshold,
}: ProductionTabProps) {
  const [product, setProduct] = useState<ProductData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [productFormOpen, setProductFormOpen] = useState(false)
  const [entryFormOpen, setEntryFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<{
    id: string
    taux: number
    date: Date
  } | null>(null)
  const [editingProduction, setEditingProduction] = useState<{
    id: string
    taux: number
    date: Date
  } | null>(null)

  const fetchData = useCallback(async () => {
    const result = await getPhaseProduction(phaseId)
    if (result.success && result.data) {
      setProduct(result.data as ProductData)
    } else {
      setProduct(null)
    }
    setIsLoading(false)
  }, [phaseId])

  useEffect(() => {
    getPhaseProduction(phaseId).then((result) => {
      if (result.success && result.data) {
        setProduct(result.data as ProductData)
      } else {
        setProduct(null)
      }
      setIsLoading(false)
    })
  }, [phaseId])

  async function handleDeleteProduction(productionId: string) {
    await deleteProduction(productionId)
    fetchData()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="Aucun plan de production"
          description="Créez d'abord un plan de production pour cette phase afin de pouvoir suivre l'avancement réel."
          icon={<Target className="size-6" />}
          action={
            canEdit
              ? {
                  label: "Créer le plan de production",
                  onClick: () => setProductFormOpen(true),
                }
              : undefined
          }
        />

        <ProductForm
          open={productFormOpen}
          onOpenChange={setProductFormOpen}
          phaseId={phaseId}
          phaseMontantHT={phaseMontantHT}
          onSuccess={fetchData}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border bg-card px-3 py-2 text-sm">
            <span className="text-muted-foreground">Taux planifié : </span>
            <span className="font-medium">{product.taux}%</span>
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => setEntryFormOpen(true)}>
            <Plus className="mr-2 size-4" />
            Ajouter une entrée
          </Button>
        )}
      </div>

      <ProductionCharts
        product={product}
        productions={product.Productions}
        phaseMontantHT={phaseMontantHT}
      />

      <ProductionTable
        product={product}
        productions={product.Productions}
        onEdit={(prod) => {
          setEditingProduction(prod)
          setEntryFormOpen(true)
        }}
        onDelete={handleDeleteProduction}
        canEdit={canEdit}
      />

      <ProductForm
        open={productFormOpen}
        onOpenChange={(open) => {
          setProductFormOpen(open)
          if (!open) setEditingProduct(null)
        }}
        phaseId={phaseId}
        phaseMontantHT={phaseMontantHT}
        product={editingProduct}
        onSuccess={fetchData}
      />

      <ProductionEntryForm
        open={entryFormOpen}
        onOpenChange={(open) => {
          setEntryFormOpen(open)
          if (!open) setEditingProduction(null)
        }}
        productId={product.id}
        phaseId={phaseId}
        phaseMontantHT={phaseMontantHT}
        productTaux={product.taux}
        productionAlertThreshold={productionAlertThreshold}
        production={editingProduction}
        onSuccess={fetchData}
      />
    </div>
  )
}
