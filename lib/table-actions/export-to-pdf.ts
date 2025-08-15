import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export function exportToPDF<T extends object>(data: T[], fileName = "report.pdf") {
  const doc = new jsPDF()

  if (data.length === 0) {
    doc.text("No data available.", 10, 10)
    doc.save(fileName)
    return
  }

  // Extract headers from keys
  const columns = Object.keys(data[0]).map((key) => ({
    header: key.toUpperCase(),
    dataKey: key,
  }))

  autoTable(doc, {
    columns,
    //@ts-ignore
    body: data,
    styles: { fontSize: 8 },
    margin: { top: 20 },
    headStyles: { fillColor: [22, 160, 133] },
  })

  doc.save(fileName)
}
