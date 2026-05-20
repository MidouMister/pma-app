export interface PhaseData {
  id: string
  name: string
  code: string
  montantHT: number
  Project: { id: string; name: string; code: string }
  Product: { taux: number; montantProd: number } | null
  Production: Array<{
    id: string
    month: number
    year: number
    taux: number
    mntProd: number
  }>
  ProductionForecasts: Array<{
    month: number
    year: number
    taux: number
    mntProd: number
  }>
}
