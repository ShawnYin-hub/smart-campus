/**
 * Toast 全局提示组件
 * 用法：Toast.success('操作成功') / Toast.error('出错了')
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });
export const useToast = () => useContext(ToastContext);

const ICONS: Record<ToastType, React.FC<{ size: number }>> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES: Record<ToastType, { bg: string; border: string; icon: string; title: string }> = {
  success: {
    bg: "bg-white",
    border: "border-l-4 border-l-green-500",
    icon: "text-green-500",
    title: "text-green-700",
  },
  error: {
    bg: "bg-white",
    border: "border-l-4 border-l-red-500",
    icon: "text-red-500",
    title: "text-red-700",
  },
  warning: {
    bg: "bg-white",
    border: "border-l-4 border-l-amber-500",
    icon: "text-amber-500",
    title: "text-amber-700",
  },
  info: {
    bg: "bg-white",
    border: "border-l-4 border-l-blue-500",
    icon: "text-blue-500",
    title: "text-blue-700",
  },
};

let toastId = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${++toastId}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast 容器 */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-80">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type];
          const style = STYLES[toast.type];
          return (
            <div
              key={toast.id}
              className={`${style.bg} ${style.border} rounded-lg shadow-xl p-4 flex items-start gap-3 animate-in slide-in-from-right duration-300`}
            >
              <Icon size={20} className={`${style.icon} shrink-0 mt-0.5`} />
              <p className={`${style.title} text-sm flex-1 leading-relaxed`}>{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

// 全局快捷方法
export const Toast = {
  success: (message: string) => window.__toast?.("success", message),
  error: (message: string) => window.__toast?.("error", message),
  warning: (message: string) => window.__toast?.("warning", message),
  info: (message: string) => window.__toast?.("info", message),
};

// 挂载到 window 上供非 React 上下文调用（如普通 JS）
if (typeof window !== "undefined") {
  (window as unknown as { __toast: (type: ToastType, message: string) => void }).__toast = (
    type: ToastType,
    message: string,
  ) => {
    const event = new CustomEvent("toast", { detail: { type, message } });
    window.dispatchEvent(event);
  };
}

// 用于在 App 中捕获并转发 toast 事件的 Hook
export const useGlobalToast = (showToast: (type: ToastType, message: string) => void) => {
  useEffect(() => {
    const handler = (e: Event) => {
      const { type, message } = (e as CustomEvent).detail;
      showToast(type, message);
    };
    window.addEventListener("toast", handler);
    return () => window.removeEventListener("toast", handler);
  }, [showToast]);
};
