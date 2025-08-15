"use client"
import { FileText } from "lucide-react"

export default function ReportLayout({ children }:{ children: React.ReactNode}) {
  return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <FileText className="w-8 h-8 text-gray-700" />
            <div>
              <h1 className="text-3xl font-bold text-gray-600">Reports & Insights</h1>
              <p className="text-gray-600 mt-1 text-muted-foreground">Track trends. Export with ease. Drive better decisions.</p>
            </div>
          </div>
            { children }
        </main>
      </div>
  )
}
