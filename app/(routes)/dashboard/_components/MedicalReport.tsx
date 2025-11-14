'use client'

import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import jsPDF from 'jspdf'
import { Download, Loader2 } from 'lucide-react'


interface DoctorProfile {
  name: string;
  specialty: string;
  image?: string;
}

interface ReportData {
  sessionId?: string;
  agent?: string;
  user?: string;
  timestamp?: string;
  mainComplaint?: string;
  symptoms?: string[];
  summary?: string;
  duration?: string;
  severity?: string;
  medicationsMentioned?: string[];
  recommendations?: string[];
}

interface SessionParams {
  id?: string;
  sessionId: string;
  note?: string;
  selectedDoctor?: DoctorProfile;
  report?: ReportData;
  createdOn: string;
  status?: string;
}

type Props = {
  history: SessionParams[]
}

function MedicalReport({ history }: Props) {
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const itemsPerPage = 5

  // Filtering and Pagination Logic
  const filteredHistory = history.filter((report) =>
    report.selectedDoctor?.name.toLowerCase().includes(search.toLowerCase()) ||
    report.note?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage)
  const currentItems = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  
  // Helper to style severity
  const getSeverityStyle = (severity: string | undefined) => {
    switch (severity?.toLowerCase()) {
      case 'severe': return 'bg-red-700/80 text-white';
      case 'moderate': return 'bg-orange-500/80 text-white';
      case 'mild': return 'bg-green-600/80 text-white';
      default: return 'bg-gray-600/50 text-gray-400';
    }
  }

  // PDF Generation Logic
  const handleDownload = (report: SessionParams) => {
    if (isDownloading) return;
    setIsDownloading(report.sessionId);

    try {
      const doc = new jsPDF()
      let y = 10
      const pageWidth = 190
      const margin = 10
      let lineSpacing = 8
      
      const reportData = report.report
      
      // 1. Title and Header
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('AI Medical Consultation Report', margin, y)
      y += 10
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Doctor: ${report.selectedDoctor?.name || 'N/A'} (${report.selectedDoctor?.specialty || 'N/A'})`, margin, y)
      y += 5
      doc.text(`Patient: ${reportData?.user || 'Anonymous'}`, margin, y)
      y += 5
      doc.text(`Date: ${new Date(report.createdOn).toLocaleString()}`, margin, y)
      y += 5
      doc.text(`Session ID: ${report.sessionId}`, margin, y)
      y += lineSpacing
      
      // 2. Main Summary and Complaint
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('I. Chief Complaint & Summary', margin, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      
      const mainComplaint = `Chief Complaint: ${report.note || reportData?.mainComplaint || 'N/A'}`
      const complaintLines = doc.splitTextToSize(mainComplaint, pageWidth)
      doc.text(complaintLines, margin, y)
      y += complaintLines.length * 5 + 3
      
      const summaryText = reportData?.summary || 'No summary generated.'
      const summaryLines = doc.splitTextToSize(`Summary: ${summaryText}`, pageWidth)
      doc.text(summaryLines, margin, y)
      y += summaryLines.length * 5
      y += lineSpacing

      // 3. Structured Data
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('II. Clinical Findings', margin, y)
      y += 5
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)

      doc.text(`Severity: ${reportData?.severity || 'N/A'}`, margin, y)
      y += 5
      doc.text(`Duration: ${reportData?.duration || 'N/A'}`, margin, y)
      y += 5
      
      const symptomsText = `Symptoms: ${reportData?.symptoms?.join(', ') || 'N/A'}`
      const symptomsLines = doc.splitTextToSize(symptomsText, pageWidth)
      doc.text(symptomsLines, margin, y)
      y += symptomsLines.length * 5 + 3
      
      const medsText = `Medications Mentioned: ${reportData?.medicationsMentioned?.join(', ') || 'None'}`
      const medsLines = doc.splitTextToSize(medsText, pageWidth)
      doc.text(medsLines, margin, y)
      y += medsLines.length * 5
      y += lineSpacing
      
      // 4. Recommendations
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('III. Recommendations', margin, y)
      y += 5
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      
      if (reportData?.recommendations && reportData.recommendations.length > 0) {
        reportData.recommendations.forEach((rec, idx) => {
          const recText = `${idx + 1}. ${rec}`
          const recLines = doc.splitTextToSize(recText, pageWidth)
          doc.text(recLines, margin, y)
          y += recLines.length * 5 + 2
        })
      } else {
        doc.text('No specific recommendations provided.', margin, y)
      }
      
      y += lineSpacing
      
      // 5. Disclaimer
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.text('Disclaimer: This is an AI-generated report for informational purposes only.', margin, y)
      y += 4
      doc.text('Please consult a licensed healthcare professional for medical advice.', margin, y)
      
      // Save PDF
      doc.save(`medical_report_${report.sessionId}_${Date.now()}.pdf`)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF report.')
    } finally {
      setIsDownloading(null)
    }
  }
  
  return (
    <motion.div
      className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.h2
        className="text-4xl font-extrabold mb-8 text-center bg-gradient-to-br from-cyan-400 to-purple-400 bg-clip-text text-transparent"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Medical Report History
      </motion.h2>

      <motion.div
        className="w-full max-w-6xl bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <input
            type="text"
            placeholder="Search by doctor or complaint..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 rounded-xl bg-gray-700 text-white border border-cyan-400/30 w-full md:w-1/2 focus:ring-purple-500 focus:border-purple-500 transition"
          />
          
          <div className="text-sm text-gray-400">
            Total Reports: <span className="text-white font-semibold">{filteredHistory.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-700">
          <Table className="min-w-full text-white">
            <TableCaption className="text-gray-400">
              Your medical consultation history powered by AI
            </TableCaption>
            <TableHeader>
              <TableRow className="bg-gray-700/80 border-gray-600">
                <TableHead className="text-white font-semibold">Doctor</TableHead>
                <TableHead className="text-white font-semibold">Severity</TableHead>
                <TableHead className="text-white font-semibold">Chief Complaint</TableHead>
                <TableHead className="text-white font-semibold">Date</TableHead>
                <TableHead className="text-white text-right font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                    {search ? 'No reports match your search.' : 'No reports found. Start a consultation to generate reports!'}
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((report, index) => (
                  <motion.tr
                    key={report.sessionId || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-700 transition-all border-gray-700/50"
                  >
                    <TableCell className="font-medium text-cyan-300">
                      {report.selectedDoctor?.name || 'N/A'}
                      <div className="text-xs text-gray-400">{report.selectedDoctor?.specialty || ''}</div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityStyle(report.report?.severity)}`}>
                        {report.report?.severity?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate text-gray-300">
                      {report.note || report.report?.mainComplaint || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-400">
                      {new Date(report.createdOn).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        onClick={() => handleDownload(report)}
                        disabled={isDownloading === report.sessionId || !report.report}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDownloading === report.sessionId ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Download PDF
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 p-3 bg-gray-700/50 rounded-xl">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1 || isDownloading !== null}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="bg-gray-600 hover:bg-gray-500 text-white border-gray-500 disabled:opacity-50"
            >
              Previous
            </Button>
            <p className="text-white font-medium">
              Page {currentPage} of {totalPages}
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages || isDownloading !== null}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="bg-gray-600 hover:bg-gray-500 text-white border-gray-500 disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default MedicalReport