export interface UserProfile {
  name: string;
  id: string;
  avatarUrl: string;
}

export interface SchoolInfo {
  name: string;
  logoUrl: string;
}

export interface Course {
  id: string;
  name: string;
  time: string;
  location: string;
  type: 'science' | 'book' | 'math' | 'calculus';
}

export interface Task {
  id: string;
  title: string;
  deadline: string;
  type: 'report' | 'reading';
  status: 'pending' | 'completed';
  aiHabitSummary?: string; // AI prediction e.g., "Suggestion: start 2hr earlier based on habit"
  urgencyLevel?: 'low' | 'medium' | 'high';
}

export interface Notification {
  id: string;
  sender: string;
  content: string;
  time: string;
  type: 'homework' | 'school' | 'teacher';
  isRead: boolean;
}

export interface AISummarizedNotice {
  id: string;
  event: string;
  time: string;
  location: string;
  originalText: string;
}

export interface RecognitionHistory {
  id: string;
  location: string;
  time: string;
  status: 'success' | 'leave';
  type: 'entry' | 'dining' | 'library';
}

export interface LeaveRequest {
  id: string;
  type: string;
  dateRange: string;
  reason: string;
  status: 'approved' | 'pending' | 'rejected';
}

export interface AppData {
  user: UserProfile;
  school: SchoolInfo;
  currentCourse?: Course;
  todaySchedule: Course[];
  tasks: Task[];
  notifications: Notification[];
  aiNotices: AISummarizedNotice[];
  leaveHistory: LeaveRequest[];
  recognitionHistory: RecognitionHistory[];
}
