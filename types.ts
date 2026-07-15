
export type UserRole = 'SUPER_ADMIN' | 'HR_MANAGER' | 'LEARNER';

export type UserDepartment = 'HR' | 'SALES' | 'MARKETING' | 'ENGINEERING' | 'FINANCE' | 'OPERATIONS' | 'CUSTOMER_SUPPORT';

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  department: string;
  status: 'Active' | 'Inactive' | 'Blocked';
  lastLogin: string;
}

export interface ScormPackage {
  id: string;
  fileName: string;
  storagePath: string;
  scromVersion?: string;
  uploadDate: string;
  size: string;
  scormVersion: 'SCORM_1.2' | 'SCORM_2004';
}


export interface Lesson {
  id: string;
  title: string;
  description?: string;
  type: 'SCORM'; // Can be extended to VIDEO, QUIZ later
  content?: ScormPackage;
}

export interface Module {
  id: string;
  name: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  version: string;
  tags: string[];
  visibility: 'INTERNAL' | 'EXTERNAL' | 'DEPARTMENT';
  status: 'PUBLISHED' | 'DRAFT';
  uploadDate: string;
  createdAt?: string;
  completionRate?: number;
  modules?: Module[];
  imageUrl?: string;
  passingScore?: number;
  requireQuizPass?: boolean;
  modulePacingEnabled?: boolean;
  modulePacingDays?: number;
  pacingStartDate?: string | null;
  scormPackageId?: string | null;
}

// draftTypes.ts

export interface DraftLesson {
  title: string;
  description?: string;
  scormPackageId?: string;
  scormPackage?: ScormPackage;
}

export interface DraftModule {
  name: string;
  lessons: DraftLesson[];
}

export interface DraftCourse {
  id: string; // real course id from backend
  title: string;
  description?: string;
  tags?: string[] | null;
  visibility?: string | null;
  version?: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  modules: DraftModule[];
}


export interface LearningPath {
  id: string;
  title: string;
  description: string;
  courses: string[]; // List of Course IDs
}

export interface AnalyticsMetric {
  label: string;
  value: string | number;
  change: number; // percentage
  trend: 'up' | 'down' | 'neutral';
}

export type ViewState = 'DASHBOARD' | 'CONFIG' | 'USERS' | 'COURSES' | 'PATHS' | 'REWARDS';

export type PreviewState = {
  isOpen: boolean;
  courseTitle: string;
  modules: {
    id: string;
    name: string;
    lessons: {
      id: string;
      title: string;
      launchUrl: string;
      scormVersion: string;
      fileName: string;
    }[];
  }[];
  activeLessonId: string | null;
};

export type SaveDraftResult = {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  updatedAt?: string;
};

