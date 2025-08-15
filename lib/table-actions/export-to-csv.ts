import Papa from "papaparse"

export function exportToCSV<T>(data: T[], fileName = "report.csv") {
  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", fileName)
  link.click()
}
