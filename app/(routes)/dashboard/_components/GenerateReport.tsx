'use client';

import { useState } from "react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileText, Download, Zap, CheckCircle, Activity, User, Clock, Shield } from "lucide-react";
import { motion } from "framer-motion";

//  The complexity of LLM parsing means array fields may sometimes be strings.
// Ensure your backend handles this by always returning arrays.

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ReportType {
  sessionId: string;
  agent: string;
  user: string;
  timestamp: string;
  mainComplaint: string;
  symptoms: string[];
  summary: string;
  duration: string;
  severity: string;
  medicationsMentioned: string[];
  recommendations: string[];
}

interface Props {
  sessionId: string;
  messages: Message[];
  doctorProfile: { name: string; specialty: string }; 
}

// --- Helper for Severity Display ---
const getSeverityStyle = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case 'severe': return 'bg-red-700 text-white';
    case 'moderate': return 'bg-orange-600 text-white';
    default: return 'bg-green-600 text-white';
  }
};

export default function GenerateReport({ sessionId, messages, doctorProfile }: Props) {
  const [report, setReport] = useState<ReportType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    if (!messages.length) {
      toast.error("No conversation data found. Try speaking to the assistant first.");
      return;
    }

    setIsGenerating(true);

    // Data preparation for the backend API call
    const sessionParams = {
      name: doctorProfile.name,
      specialty: doctorProfile.specialty
    };

    try {
      const res = await fetch("/api/medical-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          sessionParams,
          messages,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to generate report.");

      setReport(data.data);
      toast.success(" Medical report generated successfully!");
    } catch (error: any) {
      console.error(" Generate report error:", error.message);
      toast.error("Error generating report: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (!report) return;

    // Set loading state for download visualization
    const downloadId = report.sessionId;
    setIsGenerating(true); 

    const doc = new jsPDF();
    const margin = 20;
    let y = margin;
    const lineHeight = 10;

    // --- Header ---
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#333333'); 
    doc.text("N-ATLAS Consultation Report", margin, y);
    y += lineHeight * 2;

    // --- Meta Data ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#666666'); 
    doc.text(`Agent: ${report.agent}`, margin, y); y += 5;
    doc.text(`Patient: ${report.user}`, margin, y); y += 5;
    doc.text(`Date: ${new Date(report.timestamp).toLocaleDateString()}`, margin, y); y += 15;

    //  Complaint & Severity ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#4a4a4a'); 
    doc.text("I. Complaint & Assessment", margin, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#333333');

    // Severity (Highlighted)
    doc.text(`Severity: ${report.severity.toUpperCase()}`, margin, y);
    doc.text(`Duration: ${report.duration}`, margin + 60, y);
    y += 8;

    doc.text(`Main Complaint:`, margin, y);
    doc.setTextColor('#000000'); 
    doc.text(doc.splitTextToSize(report.mainComplaint, 170), margin + 40, y);
    y += doc.splitTextToSize(report.mainComplaint, 170).length * 5;
    y += 5;


    //  Analysis & Findings ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#4a4a4a');
    doc.text("II. Summary and Findings", margin, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#333333');

    // Summary (Wrapped text)
    doc.text(`Summary:`, margin, y);
    doc.setTextColor('#000000');
    const summaryLines = doc.splitTextToSize(report.summary, 170);
    doc.text(summaryLines, margin + 40, y);
    y += summaryLines.length * 5;
    y += 5;

    // Symptoms
    doc.setTextColor('#333333');
    doc.text(`Symptoms: ${report.symptoms.join(", ")}`, margin, y); y += 8;
    doc.text(`Medications Mentioned: ${report.medicationsMentioned.join(", ") || "None"}`, margin, y); y += 15;

    //  Recommendations ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#4a4a4a');
    doc.text("III. Next Steps & Recommendations", margin, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#000000');

    const recs = report.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n');
    const recsLines = doc.splitTextToSize(recs, 170);
    doc.text(recsLines, margin, y);

    // Final Save
    setTimeout(() => {
      doc.save(`medical-report-${report.sessionId}.pdf`);
      setIsGenerating(false);
    }, 500); 

  };

  return (
    <div className="mt-8 text-center space-y-8">
      {/* Generate & Download Buttons */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={generateReport}
          disabled={isGenerating || (report !== null)}
          className="flex items-center gap-3 bg-gradient-to-r from-green-600 to-cyan-500 hover:from-green-700 hover:to-cyan-600 text-white px-6 py-3 text-base font-semibold shadow-lg transition-all duration-300"
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin w-5 h-5" /> Generating...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" /> {report ? 'Regenerate Report' : 'Generate Final Report'}
            </>
          )}
        </Button>

        {report && (
          <Button
            onClick={downloadPDF}
            disabled={isGenerating}
            className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 text-base font-semibold shadow-lg transition-all duration-300"
          >
            <Download className="w-5 h-5" /> Download PDF
          </Button>
        )}
      </div>

      {/* Formatted Report Card */}
      {report && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto mt-6 bg-[#0f172a] rounded-2xl shadow-[0_0_20px_rgba(52,211,255,0.2)] border border-cyan-400/20"
        >
          <CardContent className="p-8 space-y-6 text-left text-gray-200">
            <h3 className="text-3xl font-extrabold text-cyan-400 mb-6 border-b border-gray-700 pb-3 text-center">
              🧾 Consultation Report Preview
            </h3>

            {/* Metadata Section */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm border-b border-gray-700 pb-4">
              <p className="flex items-center gap-2 text-cyan-300"><Clock className="w-4 h-4" /> <strong>Date:</strong> <span className="text-gray-300">{new Date(report.timestamp).toLocaleDateString()}</span></p>
              <p className="flex items-center gap-2 text-cyan-300"><User className="w-4 h-4" /> <strong>User ID:</strong> <span className="text-gray-300">{report.user}</span></p>
              <p className="flex items-center gap-2 text-cyan-300"><Activity className="w-4 h-4" /> <strong>Agent:</strong> <span className="text-gray-300">{report.agent}</span></p>
              <p className="flex items-center gap-2 text-cyan-300"><Shield className="w-4 h-4" /> <strong>Session ID:</strong> <span className="text-gray-300 text-xs">{report.sessionId.substring(0, 8)}...</span></p>
            </div>

            {/* Primary Analysis Section */}
            <div className="space-y-4 pt-4">
              <h4 className="text-xl font-semibold text-purple-400">Main Findings</h4>

              <div className="flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700">
                <p className="font-medium text-cyan-300">Severity Level:</p>
                <span className={`px-4 py-1 rounded-full text-sm font-bold ${getSeverityStyle(report.severity)}`}>
                  {report.severity.toUpperCase()}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <p className="font-medium text-cyan-300">Complaint:</p>
                <p className="bg-gray-800 p-3 rounded-lg italic text-gray-300">{report.mainComplaint}</p>
              </div>
            </div>

            {/* Symptoms and Recommendations */}
            <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-gray-800 mt-6">
              <div>
                <p className="font-medium text-purple-400 mb-2">Detected Symptoms:</p>
                <ul className="list-disc ml-5 space-y-1 text-gray-300">
                  {report.symptoms.length
                    ? report.symptoms.map((s, i) => <li key={i}>{s}</li>)
                    : <li>No specific symptoms identified.</li>}
                </ul>
              </div>
              <div>
                <p className="font-medium text-purple-400 mb-2">Recommendations:</p>
                <ul className="list-disc ml-5 space-y-1 text-gray-300">
                  {report.recommendations.length
                    ? report.recommendations.map((r, i) => <li key={i}>{r}</li>)
                    : <li>Consultation concluded.</li>}
                </ul>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 pt-4 border-t border-gray-700">
              <p className="font-medium text-cyan-300 mb-2">Summary of Consultation:</p>
              <p className="bg-gray-800 p-3 rounded-lg text-gray-300 whitespace-pre-line text-sm">
                {report.summary}
              </p>
            </div>

          </CardContent>
        </motion.div>
      )}
    </div>
  );
}