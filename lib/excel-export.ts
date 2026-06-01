import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { FlatProductionStat } from "@/components/production/production-stats-dashboard"

const MONTH_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
]

export async function exportToExcel(
  data: FlatProductionStat[],
  companyName: string,
  unitName: string
) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = companyName
  workbook.created = new Date()

  const sheet = workbook.addWorksheet("Statistiques de Production", {
    views: [{ state: "frozen", ySplit: 5 }],
  })

  // Header rows
  sheet.mergeCells("A1:G1")
  const titleCell = sheet.getCell("A1")
  titleCell.value = "STATISTIQUES DE PRODUCTION"
  titleCell.font = {
    name: "Arial",
    size: 16,
    bold: true,
    color: { argb: "FFFFFFFF" },
  }
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F46E5" },
  } // Indigo
  titleCell.alignment = { vertical: "middle", horizontal: "center" }

  sheet.mergeCells("A2:G2")
  const companyCell = sheet.getCell("A2")
  companyCell.value = `Entreprise : ${companyName}`
  companyCell.font = { name: "Arial", size: 12, bold: true }

  sheet.mergeCells("A3:G3")
  const unitCell = sheet.getCell("A3")
  unitCell.value = `Unité : ${unitName}`
  unitCell.font = { name: "Arial", size: 12, italic: true }

  sheet.mergeCells("A4:G4")
  const dateCell = sheet.getCell("A4")
  dateCell.value = `Exporté le : ${new Date().toLocaleDateString("fr-DZ")} à ${new Date().toLocaleTimeString("fr-DZ")}`
  dateCell.font = { name: "Arial", size: 10, color: { argb: "FF6B7280" } }

  // Columns definition
  sheet.columns = [
    { header: "Projet", key: "project", width: 30 },
    { header: "Phase", key: "phase", width: 30 },
    { header: "Mois/Année", key: "date", width: 15 },
    { header: "Taux Prévu (%)", key: "forecastTaux", width: 15 },
    { header: "Taux Réalisé (%)", key: "actualTaux", width: 15 },
    { header: "Montant Prévu (DA)", key: "forecastMnt", width: 25 },
    { header: "Montant Produit (DA)", key: "actualMnt", width: 25 },
  ]

  // Style the header row (row 5)
  const headerRow = sheet.getRow(5)
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } }
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF374151" },
  } // Gray-800
  headerRow.alignment = { vertical: "middle", horizontal: "center" }

  // Add data
  data.forEach((row) => {
    sheet.addRow({
      project: row.projectName,
      phase: row.phaseName,
      date: `${MONTH_LABELS[row.month - 1]} ${row.year}`,
      forecastTaux: row.forecastTaux,
      actualTaux: row.actualTaux,
      forecastMnt: row.forecastMnt,
      actualMnt: row.actualMnt,
    })
  })

  // Format currency and numbers
  sheet.getColumn("forecastTaux").numFmt = "0.00"
  sheet.getColumn("actualTaux").numFmt = "0.00"
  sheet.getColumn("forecastMnt").numFmt = "#,##0.00"
  sheet.getColumn("actualMnt").numFmt = "#,##0.00"

  // Alignments for data columns
  sheet.getColumn("date").alignment = { horizontal: "center" }
  sheet.getColumn("forecastTaux").alignment = { horizontal: "right" }
  sheet.getColumn("actualTaux").alignment = { horizontal: "right" }
  sheet.getColumn("forecastMnt").alignment = { horizontal: "right" }
  sheet.getColumn("actualMnt").alignment = { horizontal: "right" }

  // Borders for all cells
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber >= 5) {
      row.eachCell({ includeEmpty: false }, (cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        }
      })
    }
  })

  // Generate buffer and save
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  saveAs(
    blob,
    `Statistiques_Production_${unitName.replace(/\s+/g, "_")}_${new Date().getTime()}.xlsx`
  )
}

export interface ProjectExcelRow {
  name: string
  code: string
  clientName: string | null
  status: string
  montantHT: number
  montantTTC: number
  ods: Date | null
  delaiMonths: number
  delaiDays: number
  progress: number
}

export async function exportProjectsToExcel(
  data: ProjectExcelRow[],
  companyName: string,
  unitName: string
) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = companyName
  workbook.created = new Date()

  const sheet = workbook.addWorksheet("Projets", {
    views: [{ state: "frozen", ySplit: 5 }],
  })

  // Header rows
  sheet.mergeCells("A1:J1")
  const titleCell = sheet.getCell("A1")
  titleCell.value = "LISTE DES PROJETS"
  titleCell.font = {
    name: "Arial",
    size: 16,
    bold: true,
    color: { argb: "FFFFFFFF" },
  }
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F46E5" },
  }
  titleCell.alignment = { vertical: "middle", horizontal: "center" }

  sheet.mergeCells("A2:J2")
  const companyCell = sheet.getCell("A2")
  companyCell.value = `Entreprise : ${companyName}`
  companyCell.font = { name: "Arial", size: 12, bold: true }

  sheet.mergeCells("A3:J3")
  const unitCell = sheet.getCell("A3")
  unitCell.value = `Unité : ${unitName}`
  unitCell.font = { name: "Arial", size: 12, italic: true }

  sheet.mergeCells("A4:J4")
  const dateCell = sheet.getCell("A4")
  dateCell.value = `Exporté le : ${new Date().toLocaleDateString("fr-DZ")} à ${new Date().toLocaleTimeString("fr-DZ")}`
  dateCell.font = { name: "Arial", size: 10, color: { argb: "FF6B7280" } }

  // Columns definition
  sheet.columns = [
    { header: "Projet", key: "name", width: 35 },
    { header: "Code", key: "code", width: 18 },
    { header: "Client", key: "clientName", width: 25 },
    { header: "Statut", key: "status", width: 15 },
    { header: "Montant HT (DA)", key: "montantHT", width: 22 },
    { header: "Montant TTC (DA)", key: "montantTTC", width: 22 },
    { header: "ODS", key: "ods", width: 16 },
    { header: "Délai (mois)", key: "delaiMonths", width: 14 },
    { header: "Délai (jours)", key: "delaiDays", width: 14 },
    { header: "Progression (%)", key: "progress", width: 16 },
  ]

  // Style the header row (row 5)
  const headerRow = sheet.getRow(5)
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } }
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF374151" },
  }
  headerRow.alignment = { vertical: "middle", horizontal: "center" }

  // Add data
  data.forEach((row) => {
    sheet.addRow({
      name: row.name,
      code: row.code,
      clientName: row.clientName ?? "",
      status: row.status,
      montantHT: row.montantHT,
      montantTTC: row.montantTTC,
      ods: row.ods ? row.ods.toLocaleDateString("fr-DZ") : "",
      delaiMonths: row.delaiMonths,
      delaiDays: row.delaiDays,
      progress: row.progress,
    })
  })

  // Format numbers
  sheet.getColumn("montantHT").numFmt = "#,##0.00"
  sheet.getColumn("montantTTC").numFmt = "#,##0.00"
  sheet.getColumn("montantHT").alignment = { horizontal: "right" }
  sheet.getColumn("montantTTC").alignment = { horizontal: "right" }
  sheet.getColumn("delaiMonths").alignment = { horizontal: "center" }
  sheet.getColumn("delaiDays").alignment = { horizontal: "center" }
  sheet.getColumn("progress").alignment = { horizontal: "center" }

  // Borders for all cells
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber >= 5) {
      row.eachCell({ includeEmpty: false }, (cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        }
      })
    }
  })

  // Generate buffer and save
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  saveAs(
    blob,
    `Projets_${unitName.replace(/\s+/g, "_")}_${new Date().getTime()}.xlsx`
  )
}
