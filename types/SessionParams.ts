export interface DoctorProfile {
  name: string;
  specialty: string;
  image?: string;
}

export interface ReportData {
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

export interface SessionParams {
  id?: string;
  sessionId: string;
  note?: string;
  selectedDoctor?: DoctorProfile;
  report?: ReportData;
  createdOn: string;
  status?: string;
}
