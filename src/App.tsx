import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutGrid,
  ListChecks,
  Users,
  Search,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  login,
  logout as authLogout,
  isAuthenticated,
} from "./services/auth.service";
import {
  getDashboardOverview,
  getDashboardAlerts,
  type Alert,
} from "./services/dashboard.service";
import {
  getApprovalStats,
  type ApprovalStats,
} from "./services/approval.service";
import { getPersonStats, type PersonStats } from "./services/person.service";
import { getUnreadCount } from "./services/notification.service";
import { ToastProvider, useToast } from "./components/ui/Toast";
import OverviewView from "./components/views/OverviewView";
import ApprovalView from "./components/views/ApprovalView";
import PersonnelView from "./components/views/PersonnelView";
import SettingsView from "./components/views/SettingsView";
import NotificationCenter from "./components/views/NotificationCenter";
import LoginView from "./components/views/LoginView";
import schoolLogo from "./assets/Beijing_No.4_High_School_Logo.jpg";

type ViewType = "overview" | "approval" | "personnel" | "settings" | "notifications";

interface BriefingData {
  title: string;
  content: string;
  tags: string[];
}

interface StatDonut {
  label: string;
  percentage: number;
  completedText: string;
  subStats: { label: string; value: string | number }[];
  colorClass: string;
}

interface Task {
  id: string;
  icon: React.FC<{ size: number }>;
  title: string;
  level: string;
  desc: string;
  time: string;
  type: "error" | "warning" | "info";
}

// ================================================================
// App Logo (SVG as data URL for portability)
// ================================================================
const APP_LOGO_URL = schoolLogo;
const APP_NAME = "BHSFIC";

// ================================================================
// App Layout (includes Toast context)
// ================================================================
function AppLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => isAuthenticated());
  const [activeView, setActiveView] = useState<ViewType>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [userName, setUserName] = useState("Admin User");
  const [userAvatar, setUserAvatar] = useState(APP_LOGO_URL);
  const [userRole, setUserRole] = useState("超级管理员");
  const [userEmail, setUserEmail] = useState("admin@campus.edu.cn");
  const [userBio, setUserBio] = useState("致力于建设智慧、安全、和谐的高品质校园文化。");

  const [briefingData, setBriefingData] = useState<BriefingData | null>(null);
  const [stats, setStats] = useState<StatDonut[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [approvalStats, setApprovalStats] = useState<ApprovalStats | null>(null);
  const [personStats, setPersonStats] = useState<PersonStats | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const { showToast } = useToast();

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      showToast("error", "加载未读通知数失败");
    }
  }, [isLoggedIn, showToast]);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const [overview, alerts, aStats, pStats] = await Promise.all([
        getDashboardOverview().catch(() => null),
        getDashboardAlerts().catch(() => null),
        getApprovalStats().catch(() => null),
        getPersonStats().catch(() => null),
      ]);

      if (overview) {
        setBriefingData(overview.briefing);
        setStats(
          overview.stats.map((s) => ({
            ...s,
            subStats: s.subStats.map((sub) => ({
              label: sub.label,
              value: sub.value,
            })),
          }))
        );
        setApprovalStats(aStats ?? null);
        setPersonStats(pStats ?? null);
      }

      if (alerts?.alerts) {
        const alertIcons: Record<string, React.FC<{ size: number }>> = {
          error: AlertTriangle,
          warning: AlertTriangle,
          info: Info,
        };
        setTasks(
          alerts.alerts.map((alert: Alert, i: number) => ({
            id: alert.id,
            icon: alertIcons[alert.type] || Info,
            title: alert.title,
            level: alert.level,
            desc: alert.desc,
            time: alert.time,
            type: alert.type,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      showToast("error", "加载仪表盘数据失败");
    }
  }, [isLoggedIn, showToast]);

  useEffect(() => {
    if (isLoggedIn) {
      loadDashboardData();
      loadUnreadCount();
    }
  }, [isLoggedIn, loadDashboardData, loadUnreadCount]);

  const handleLogin = async (identifier: string, password: string) => {
    setIsLoading(true);
    setLoginError("");
    try {
      const data = await login(identifier, password);
      setUserName(data.user.full_name || data.user.username);
      setUserEmail(data.user.email);
      setUserRole(data.user.role === "admin" ? "超级管理员" : "操作员");
      setIsLoggedIn(true);
      showToast("success", "登录成功，欢迎回来！");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "登录失败，请检查账号密码";
      setLoginError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    authLogout();
    setIsLoggedIn(false);
    setActiveView("overview");
    setSearchQuery("");
    setBriefingData(null);
    setStats([]);
    setTasks([]);
    setApprovalStats(null);
    setPersonStats(null);
    setUnreadCount(0);
  };

  const handleUpdateProfile = (name: string, avatar: string, role: string, email: string, bio: string) => {
    setUserName(name);
    setUserAvatar(avatar);
    setUserRole(role);
    setUserEmail(email);
    setUserBio(bio);
    showToast("success", "个人信息已更新");
  };

  const handleBellClick = () => {
    setActiveView((prev) => (prev === "notifications" ? "overview" : "notifications"));
  };

  if (!isLoggedIn) {
    return (
      <LoginView
        onLogin={handleLogin}
        appName={APP_NAME}
        logoUrl={APP_LOGO_URL}
        isLoading={isLoading}
        error={loginError}
      />
    );
  }

  const currentDate = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const navItems = [
    { id: "overview", label: "总览大屏", icon: LayoutGrid },
    { id: "approval", label: "智能审批", icon: ListChecks },
    { id: "personnel", label: "数据与人员", icon: Users },
  ];

  return (
    <div className="flex min-h-screen bg-surface selection:bg-mahogany/10 text-midnight font-sans">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-midnight/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          fixed left-0 top-0 h-full w-72 bg-white border-r border-gray-100 flex flex-col p-6 z-50
          transition-transform duration-300 lg:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between mb-10 px-2 lg:justify-start lg:gap-3">
          <button
            onClick={() => setActiveView("overview")}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity outline-none"
          >
            <img
              src={APP_LOGO_URL}
              alt={APP_NAME}
              className="w-10 h-10 object-contain rounded-lg"
            />
            <div className="text-left">
              <h1 className="text-xl font-display font-extrabold tracking-tight text-midnight leading-tight">
                {APP_NAME}
              </h1>
              <p className="text-[10px] text-stony font-bold uppercase tracking-wider leading-none">
                Management Portal
              </p>
            </div>
          </button>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-stony lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id as ViewType);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-full font-display text-sm font-semibold transition-all duration-300 ${
                activeView === item.id
                  ? "bg-mahogany text-white shadow-lg shadow-mahogany/20 scale-[1.02]"
                  : "text-stony hover:text-midnight hover:bg-gray-50"
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}

          <button
            onClick={() => {
              setActiveView("notifications");
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-full font-display text-sm font-semibold transition-all duration-300 ${
              activeView === "notifications"
                ? "bg-red-500 text-white shadow-lg shadow-red-500/20 scale-[1.02]"
                : "text-stony hover:text-red-500 hover:bg-red-50"
            }`}
          >
            <div className="flex items-center gap-4">
              <Bell size={20} />
              <span>通知中心</span>
            </div>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </nav>

        <div className="mt-auto p-4 bg-gray-50 rounded-2xl flex items-center gap-3 border border-gray-100/50">
          <button
            onClick={() => setActiveView("settings")}
            className="flex flex-1 items-center gap-3 outline-none group text-left"
          >
            <div className="relative">
              <img
                src={userAvatar}
                alt={userName}
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm group-hover:scale-105 transition-transform"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-display font-bold text-midnight truncate group-hover:text-mahogany transition-colors">
                {userName}
              </p>
              <p className="text-[10px] text-stony font-semibold uppercase truncate tracking-tighter opacity-70">
                {userRole}
              </p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-stony hover:text-mahogany transition-colors rounded-lg hover:bg-white active:scale-95 transition-all"
            title="退出登录"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen lg:ml-72 transition-all duration-300">
        <header className="sticky top-0 right-0 glass-header h-20 flex items-center justify-between px-6 lg:px-10 z-[45]">
          <div className="flex items-center gap-4 lg:hidden">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-midnight hover:bg-gray-100 rounded-lg transition-all"
            >
              <Menu size={24} />
            </button>
          </div>

          <div className="hidden md:flex flex-1 max-w-xl mx-4 lg:mx-0">
            <div className="relative group w-full">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stony group-focus-within:text-mahogany transition-colors"
                size={18}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索审批项、档案、任务或报告..."
                className="w-full bg-gray-100/50 border border-transparent focus:border-mahogany/20 rounded-full py-2.5 pl-12 pr-4 text-xs font-medium focus:ring-4 focus:ring-mahogany/5 transition-all outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stony hover:text-mahogany"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4 lg:ml-8">
            <button
              onClick={handleBellClick}
              className={`p-2 lg:p-2.5 rounded-full transition-all relative ${
                activeView === "notifications"
                  ? "bg-red-500 text-white shadow-lg"
                  : "text-stony hover:text-midnight hover:bg-gray-100"
              }`}
              title="通知中心"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveView("settings")}
              className={`p-2 lg:p-2.5 rounded-full transition-all ${
                activeView === "settings"
                  ? "bg-mahogany text-white shadow-lg shadow-mahogany/20"
                  : "text-stony hover:text-midnight hover:bg-gray-100"
              }`}
              title="设置"
            >
              <Settings size={20} />
            </button>

            <div className="hidden sm:block h-6 w-px bg-gray-200 mx-2" />

            <div className="hidden lg:block text-right">
              <p className="text-xs font-display font-bold text-midnight tracking-tight leading-none mb-1">
                {currentDate.split(" ")[0]}
              </p>
              <p className="text-[10px] text-stony font-black uppercase tracking-[0.1em] opacity-60">
                {currentDate.split(" ")[1]}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="p-6 lg:p-10 pb-20 max-w-7xl mx-auto w-full"
            >
              {activeView === "overview" && (
                <OverviewView
                  briefingData={briefingData || undefined}
                  stats={stats.length > 0 ? stats : undefined}
                  personStats={personStats || undefined}
                  tasks={tasks}
                  searchQuery={searchQuery}
                  onViewAllTasks={() => setActiveView("approval")}
                />
              )}
              {activeView === "approval" && (
                <ApprovalView
                  searchQuery={searchQuery}
                  approvalStats={approvalStats || undefined}
                  onRefresh={loadDashboardData}
                />
              )}
              {activeView === "personnel" && (
                <PersonnelView
                  searchQuery={searchQuery}
                  personStats={personStats || undefined}
                  onRefresh={loadDashboardData}
                />
              )}
              {activeView === "settings" && (
                <SettingsView
                  userName={userName}
                  userRole={userRole}
                  userEmail={userEmail}
                  userAvatar={userAvatar}
                  userBio={userBio}
                  onUpdateProfile={handleUpdateProfile}
                  onLogout={handleLogout}
                />
              )}
              {activeView === "notifications" && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
                  <NotificationCenter />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ================================================================
// Root: wrap with ToastProvider
// ================================================================
export default function App() {
  return (
    <ToastProvider>
      <AppLayout />
    </ToastProvider>
  );
}
