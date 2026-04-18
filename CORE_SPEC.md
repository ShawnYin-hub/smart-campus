# BHSFIC Campus Management Portal - Core Spec & Integration Guide

This document provides a comprehensive overview of the application's architecture, component props, and data structures to facilitate further development.

---

## 1. Project Overview
- **Framework**: React 18 (TypeScript)
- **Styling**: Tailwind CSS 4.0
- **Icons**: Lucide React
- **Animations**: Framer Motion (`motion/react`)
- **Main Entry**: `src/App.tsx`

---

## 2. Core Views & Components

### A. App Component (`src/App.tsx`)
The central controller managing global state and navigation.
- **Global States**:
  - `isLoggedIn`: Boolean (Auth status)
  - `activeView`: `'overview' | 'approval' | 'personnel' | 'settings'`
  - `searchQuery`: String (Global search input)
  - `userProfile`: { `name`, `role`, `avatar`, `email`, `bio` }
- **Handlers**:
  - `handleUpdateProfile`: Syncs profile changes to global state.
  - `handleLogin`: Validates credentials and unlocks the portal.
  - `handleLogout`: Resets session.

### B. OverviewView (`src/components/views/OverviewView.tsx`)
Dashboard summary of campus status.
- **Props**:
  - `briefingData?`: `{ title, content, tags: string[] }`
  - `stats?`: `StatDonut[]` (Visual percentage rings)
  - `tasks?`: `Task[]` (Urgent alerts)
  - `searchQuery`: Filters `tasks` by title/desc.
  - `onViewAllTasks`: Navigation callback to Approval view.

### C. ApprovalView (`src/components/views/ApprovalView.tsx`)
Workflow management for student/staff requests.
- **Props**:
  - `requests?`: `ApprovalRequest[]`
  - `searchQuery`: Filters requests by name/ID/reason.
- **Key Features**:
  - Interactive Tabs: Pending (待审批), Approved (已通过), Rejected (已拒绝).
  - Decision Modal: Confirm Approve/Reject actions.
  - Mock Pagination: 1-indexed state with visual feedback.

### D. PersonnelView (`src/components/views/PersonnelView.tsx`)
Campus database management.
- **Props**:
  - `personnel?`: `Person[]`
  - `totalCount`: Number of records.
  - `pendingFaceCount`: Records missing biometric data.
  - `cleaningProgress`: AI background task progress (0-100).
  - `searchQuery`: Filters list via student/faculty ID or name.
- **Integrations**:
  - File Upload: Triggers `handleFileUpload` with `.xlsx/.xls` support.
  - Export: Simulated download logic with loading states.

### E. SettingsView (`src/components/views/SettingsView.tsx`)
User profile and system configuration.
- **Props**:
  - `userName`, `userRole`, `userEmail`, `userAvatar`, `userBio`
  - `onUpdateProfile`: `(name, avatar, role, email, bio) => void`
  - `onLogout`: Callback to `App.tsx`.

---

## 3. Data Entities (Interfaces)

### `Person` (Personnel Data)
```typescript
{
  id: string;      // ID (Student/Staff)
  name: string;    // Name
  dept: string;    // Department/Class
  role: string;    // "教职工" | "学生"
  status: 'success' | 'error'; // Face recorded?
  avatar: string;  // Image URL
}
```

### `ApprovalRequest` (Workflow Data)
```typescript
{
  id?: string;
  type: string;    // Request Type (e.g., "离校申请")
  student: { 
    name: string; 
    id: string; 
    avatar: string 
  };
  time: string;    // Timestamp
  reason: string;  // Student reasoning
  risk: 'high' | 'low'; // AI calculated risk
  alert?: boolean; // Highlight flag
}
```

---

## 4. Integration Roadmap

### Phase 1: Authentication
- Replace the simulated `handleLogin` in `App.tsx` with a real backend/Firebase auth call.
- Implement session persistence (localStorage or Cookies).

### Phase 2: Real-time Data
- Connect `OverviewView` and `ApprovalView` to an API/Firestore. Use `onSnapshot` for real-time alert updates on the dashboard.

### Phase 3: File Processing
- Implement the actual `.xlsx` parsing logic in `PersonnelView`.
- Connect the AI "Data Cleaning" skeleton to a real background process or an LLM (Gemini API) for data sanitization.

### Phase 4: Storage
- Configure Firebase Storage or a cloud CDN to handle avatar uploads initiated from `SettingsView`.
