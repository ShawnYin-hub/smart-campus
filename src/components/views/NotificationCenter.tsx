/**
 * 通知中心页面
 * 展示所有通知，支持标记已读、删除、分页筛选。
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Trash2,
  CheckCheck,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Pin,
  Eye,
  RefreshCw,
} from "lucide-react";
import {
  getNotificationList,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllReadNotifications,
  getUnreadCount,
  NotificationItem,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_LEVEL_COLORS,
} from "../../services/notification.service";

interface NotificationCenterProps {
  onClose?: () => void;
}

const LEVEL_CONFIG: Record<string, { icon: React.FC<{ size: number }>; label: string; dot: string }> = {
  info: { icon: Info, label: "信息", dot: "bg-blue-500" },
  warning: { icon: AlertTriangle, label: "警告", dot: "bg-amber-500" },
  error: { icon: AlertTriangle, label: "紧急", dot: "bg-red-500" },
};

const TYPE_COLORS: Record<string, string> = {
  approval_request: "bg-blue-100 text-blue-700",
  approval_approved: "bg-green-100 text-green-700",
  approval_rejected: "bg-amber-100 text-amber-700",
  alert_high_risk: "bg-red-100 text-red-700",
  system: "bg-gray-100 text-gray-700",
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");

  const totalPages = Math.ceil(total / pageSize);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const isReadParam = filter === "all" ? undefined : filter === "unread" ? false : true;
      const res = await getNotificationList({
        page,
        page_size: pageSize,
        is_read: isReadParam,
        notification_type: filterType !== "all" ? filterType : undefined,
      });
      setNotifications(res.items);
      setTotal(res.total);
      setUnreadCount(res.unread_count);
    } catch {
      // 静默失败，保持现状
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filter, filterType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* 忽略 */
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      /* 忽略 */
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      const n = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (n && !n.is_read) setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* 忽略 */
    }
  };

  const handleClearRead = async () => {
    try {
      await deleteAllReadNotifications();
      setNotifications((prev) => prev.filter((n) => !n.is_read));
    } catch {
      /* 忽略 */
    }
  };

  const formatTime = (timeStr: string) => {
    const diff = Date.now() - new Date(timeStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "刚刚";
    if (mins < 60) return `${mins} 分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    return `${days} 天前`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 头部 */}
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-full">
            <Bell size={20} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">通知中心</h2>
            <p className="text-xs text-gray-500">
              {unreadCount > 0 ? `${unreadCount} 条未读` : "暂无未读通知"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCheck size={13} />
            全部已读
          </button>
          <button
            onClick={handleClearRead}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            <Trash2 size={13} />
            清空已读
          </button>
          <button
            onClick={loadData}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="刷新"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-2 px-5 py-3 bg-white border-b border-gray-100">
        {/* 状态筛选 */}
        <div className="flex items-center bg-gray-100 rounded-full p-1 gap-1">
          {(["all", "unread", "read"] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filter === f
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f === "all" ? "全部" : f === "unread" ? `未读${unreadCount > 0 ? ` (${unreadCount})` : ""}` : "已读"}
            </button>
          ))}
        </div>

        {/* 类型筛选 */}
        <div className="flex items-center gap-1">
          <Filter size={13} className="text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="text-xs text-gray-600 bg-transparent border-none outline-none cursor-pointer"
          >
            <option value="all">全部类型</option>
            <option value="alert_high_risk">高风险告警</option>
            <option value="approval_request">审批申请</option>
            <option value="approval_approved">审批通过</option>
            <option value="approval_rejected">审批拒绝</option>
            <option value="system">系统通知</option>
          </select>
        </div>
      </div>

      {/* 通知列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Bell size={48} strokeWidth={1} />
            <p className="mt-3 text-sm font-medium">暂无通知</p>
          </div>
        ) : (
          notifications.map((n) => {
            const levelCfg = LEVEL_CONFIG[n.level] || LEVEL_CONFIG.info;
            const IconComp = levelCfg.icon;
            const levelStyle = NOTIFICATION_LEVEL_COLORS[n.level] || NOTIFICATION_LEVEL_COLORS.info;
            return (
              <div
                key={n.id}
                className={`relative flex gap-3 p-4 rounded-xl border transition-all group ${
                  n.is_read
                    ? "bg-white border-gray-100 opacity-70"
                    : "bg-white border-blue-200 shadow-sm"
                }`}
              >
                {/* 未读指示条 */}
                {!n.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl" />}

                {/* 左侧图标 */}
                <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${levelStyle.replace("text-", "bg-").replace("-50", "100")}`}>
                  <IconComp size={18} />
                </div>

                {/* 中间内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {n.is_pinned && <Pin size={11} className="text-amber-500" />}
                    <span className="text-sm font-semibold text-gray-800 truncate">{n.title}</span>
                    {/* 类型标签 */}
                    <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded-full ${TYPE_COLORS[n.notification_type] || TYPE_COLORS.system}`}>
                      {NOTIFICATION_TYPE_LABELS[n.notification_type] || n.notification_type}
                    </span>
                  </div>
                  {n.message && (
                    <p className="text-xs text-gray-500 leading-relaxed mb-2 line-clamp-2">{n.message}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-400">{formatTime(n.created_at)}</span>
                    {n.is_read ? (
                      <span className="text-[11px] text-green-500 flex items-center gap-0.5">
                        <CheckCircle size={10} /> 已读
                      </span>
                    ) : (
                      <span className="text-[11px] text-blue-500 flex items-center gap-0.5">
                        <Eye size={10} /> 未读
                      </span>
                    )}
                  </div>
                </div>

                {/* 右侧操作按钮 */}
                <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="标记已读"
                    >
                      <CheckCircle size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 bg-white border-t border-gray-200">
          <span className="text-xs text-gray-500">
            第 {page} / {totalPages} 页，共 {total} 条
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 text-xs rounded-lg transition-colors ${
                    page === p ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
