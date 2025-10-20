"use client";

import { useState } from "react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileText, Download } from "lucide-react";

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
}

export default function GenerateReport({ sessionId, messages }: Props) {
  const [report, setReport] = useState<ReportType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    if (!messages.length) {
      toast.error("No conversation data found. Try speaking to the assistant first.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/medical-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          sessionParams: { doctor: "Dr. Clara, AI Medical Assistant" },
          messages,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");

      setReport(data.data);
      toast.success("✅ Medical report generated successfully!");
    } catch (error: any) {
      console.error("❌ Generate report error:", error.message);
      toast.error("Error generating report.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (!report) return;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Medical Consultation Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`Session ID: ${report.sessionId}`, 20, 30);
    doc.text(`Agent: ${report.agent}`, 20, 40);
    doc.text(`User: ${report.user}`, 20, 50);
    doc.text(`Date: ${new Date(report.timestamp).toLocaleString()}`, 20, 60);
    doc.text(`Main Complaint: ${report.mainComplaint}`, 20, 70);

    doc.text("Symptoms:", 20, 85);
    doc.text(report.symptoms.join(", "), 40, 95);

    doc.text("Summary:", 20, 110);
    doc.text(doc.splitTextToSize(report.summary, 170), 20, 120);

    doc.text(`Duration: ${report.duration}`, 20, 150);
    doc.text(`Severity: ${report.severity}`, 20, 160);

    doc.text("Medications Mentioned:", 20, 175);
    doc.text(report.medicationsMentioned.join(", ") || "None", 40, 185);

    doc.text("Recommendations:", 20, 200);
    doc.text(report.recommendations.join(", ") || "None", 40, 210);

    doc.save(`medical-report-${report.sessionId}.pdf`);
  };

  return (
    <div className="mt-6 text-center space-y-6">
      {/* Generate & Download Buttons */}
      <div className="flex justify-center gap-3">
        <Button
          onClick={generateReport}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" /> Generating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" /> Generate Report
            </>
          )}
        </Button>

        {report && (
          <Button
            onClick={downloadPDF}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        )}
      </div>

      {/* Formatted Report Card */}
      {report && (
        <Card className="max-w-3xl mx-auto shadow-md border border-gray-200 rounded-xl bg-white">
          <CardContent className="p-6 space-y-4 text-left">
            <h3 className="text-2xl font-bold text-center text-gray-800 mb-4">
              🧾 Medical Consultation Report
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
              <p><strong>Session ID:</strong> {report.sessionId}</p>
              <p><strong>Agent:</strong> {report.agent}</p>
              <p><strong>User:</strong> {report.user}</p>
              <p><strong>Date:</strong> {new Date(report.timestamp).toLocaleString()}</p>
              <p><strong>Duration:</strong> {report.duration}</p>
              <p><strong>Severity:</strong> {report.severity}</p>
            </div>

            <div className="mt-4">
              <p><strong>Main Complaint:</strong></p>
              <p className="bg-gray-50 p-2 rounded-md">{report.mainComplaint}</p>
            </div>

            <div>
              <p><strong>Symptoms:</strong></p>
              <ul className="list-disc ml-6 bg-gray-50 p-2 rounded-md">
                {report.symptoms.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>

            <div>
              <p><strong>Summary:</strong></p>
              <p className="bg-gray-50 p-2 rounded-md whitespace-pre-line">
                {report.summary}
              </p>
            </div>

            <div>
              <p><strong>Medications Mentioned:</strong></p>
              <ul className="list-disc ml-6 bg-gray-50 p-2 rounded-md">
                {report.medicationsMentioned.length
                  ? report.medicationsMentioned.map((m, i) => <li key={i}>{m}</li>)
                  : <li>None</li>}
              </ul>
            </div>

            <div>
              <p><strong>Recommendations:</strong></p>
              <ul className="list-disc ml-6 bg-gray-50 p-2 rounded-md">
                {report.recommendations.length
                  ? report.recommendations.map((r, i) => <li key={i}>{r}</li>)
                  : <li>No recommendations found</li>}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
