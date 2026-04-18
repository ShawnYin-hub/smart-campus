import { useState, useEffect, useCallback } from 'react';
import {
  Check,
  X,
  Sparkles,
  AlertTriangle,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Verified,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getApprovalList,
  approveApproval,
  rejectApproval,
  type Approval,
  type ApprovalStats,
} from '../../services/approval.service';
import { useToast } from '../../components/ui/Toast';

interface ApprovalViewProps {
  searchQuery?: string;
  approvalStats?: ApprovalStats;
  onRefresh?: () => void;
}

export default function ApprovalView({
  searchQuery = '',
  approvalStats,
  onRefresh,
}: ApprovalViewProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject';
    item: Approval | null;
  }>({ isOpen: false, type: 'approve', item: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const pageSize = 20;

  const loadApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const statusMap: Record<string, string> = {
        pending: 'pending',
        approved: 'approved',
        rejected: 'rejected',
      };
      const data = await getApprovalList({
        page: currentPage,
        page_size: pageSize,
        status: statusMap[activeTab],
        search: searchQuery || undefined,
      });
      setApprovals(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load approvals:', err);
      showToast('error', '加载审批列表失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, searchQuery, showToast]);

  useEffect(() => {
    loadApprovals();
  }, [loadApprovals]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const handleDecision = (type: 'approve' | 'reject', item: Approval) => {
    setModalState({ isOpen: true, type, item });
  };

  const confirmAction = async () => {
    if (!modalState.item) return;
    setActionLoading(modalState.item.id);
    try {
      if (modalState.type === 'approve') {
        await approveApproval(modalState.item.id);
        showToast('success', '审批已通过');
      } else {
        await rejectApproval(modalState.item.id);
        showToast('success', '审批已拒绝');
      }
      setModalState({ ...modalState, isOpen: false });
      await loadApprovals();
      onRefresh?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '操作失败，请重试';
      showToast('error', msg);
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { id: 'pending', label: '待审批' },
    { id: 'approved', label: '已通过' },
    { id: 'rejected', label: '已拒绝' },
  ];

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6 lg:space-y-10 relative max-w-7xl mx-auto">
      <div className="flex flex-col gap-8 mb-8 lg:mb-12">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 md:gap-0">
          <div>
            <h2 className="text-3xl lg:text-4xl font-display font-extrabold text-midnight tracking-tight mb-2">智能审批工作台</h2>
            <p className="text-stony text-sm font-medium flex items-center gap-2">
              <Sparkles size={16} className="text-mahogany" />
              AI 系统正自动筛选高风险审批事项
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadApprovals}
              className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-stony shadow-inner"
              title="刷新"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="flex bg-gray-100 p-1 rounded-2xl w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as typeof activeTab); setCurrentPage(1); }}
                  className={`px-4 lg:px-8 py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-display font-bold transition-all ${
                    activeTab === tab.id ? 'bg-white shadow-sm text-mahogany' : 'text-stony hover:text-midnight'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCard label="当前待办" value={`${approvalStats?.pending_count ?? '-'} 件`} highlight />
          <StatCard label="今日已处理" value={`${approvalStats?.today_processed ?? '-'} 件`} />
          <StatCard label="昨日同期" value={`${approvalStats?.yesterday_count ?? '-'} 件`} />
          <StatCard label="系统合规率" value={`${approvalStats?.compliance_rate ?? '-'}%`} accent />
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="p-20 flex items-center justify-center">
              <div className="animate-spin w-10 h-10 border-4 border-mahogany border-t-transparent rounded-full" />
            </div>
          ) : approvals.length > 0 ? (
            approvals.map((item) => (
              <ApprovalItem
                key={`${activeTab}-${item.id}`}
                {...item}
                onAction={(type) => handleDecision(type, item)}
                actionLoading={actionLoading === item.id}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-20 bg-white rounded-3xl border border-gray-100 border-dashed flex flex-col items-center justify-center text-center"
            >
              <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-stony mb-6">
                <CheckSquare size={40} />
              </div>
              <h4 className="font-display font-bold text-midnight text-xl">
                暂无{activeTab === 'pending' ? '待审批' : activeTab === 'approved' ? '已通过' : '已拒绝'}事项
              </h4>
              <p className="text-sm text-stony mt-1 max-w-xs">当前没有相关纪录，您可以查看其他分类。</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {total > pageSize && (
        <div className="mt-8 lg:mt-12 flex justify-center overflow-x-auto pb-4">
          <nav className="flex items-center gap-1 lg:gap-2 bg-white px-3 lg:px-4 py-2 lg:py-3 rounded-2xl shadow-sm border border-gray-100 whitespace-nowrap">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className={`w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center transition-colors ${currentPage === 1 ? 'text-gray-200 pointer-events-none' : 'text-stony hover:text-mahogany'}`}
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl font-bold text-xs lg:text-sm shadow-lg transition-all ${
                  currentPage === page ? 'bg-mahogany text-white shadow-mahogany/20' : 'hover:bg-gray-50 text-stony'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center text-stony hover:text-mahogany transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </nav>
        </div>
      )}

      <AnimatePresence>
        {modalState.isOpen && modalState.item && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalState({ ...modalState, isOpen: false })}
              className="absolute inset-0 bg-midnight/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-10 max-w-md w-full shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-mahogany/5 rounded-bl-full"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-2xl lg:rounded-3xl flex items-center justify-center mb-6 shadow-inner ${
                  modalState.type === 'approve' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                  {modalState.type === 'approve' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                </div>
                <h3 className="text-xl lg:text-2xl font-display font-extrabold text-midnight mb-3 tracking-tight">
                  确认{modalState.type === 'approve' ? '通过' : '拒绝'}申请？
                </h3>
                <p className="text-stony text-xs lg:text-sm font-medium mb-8 leading-relaxed px-4">
                  您确定要{modalState.type === 'approve' ? '批准' : '驳回'}来自{' '}
                  <span className="text-midnight font-bold">
                    「{modalState.item.person?.name || '未知'}」
                  </span>{' '}
                  的审批请求吗？此操作将立即生效。
                </p>
                <div className="grid grid-cols-2 gap-3 lg:gap-4 w-full">
                  <button
                    onClick={() => setModalState({ ...modalState, isOpen: false })}
                    className="py-3 lg:py-4 bg-gray-50 text-stony rounded-xl lg:rounded-2xl font-bold hover:bg-gray-100 transition-all active:scale-95 text-xs lg:text-sm"
                    disabled={!!actionLoading}
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmAction}
                    disabled={!!actionLoading}
                    className={`py-3 lg:py-4 rounded-xl lg:rounded-2xl text-white font-bold shadow-lg transition-all active:scale-95 text-xs lg:text-sm flex items-center justify-center gap-2 ${
                      modalState.type === 'approve'
                        ? 'bg-emerald-500 shadow-emerald-500/20 hover:bg-emerald-600'
                        : 'bg-red-500 shadow-red-500/20 hover:bg-red-600'
                    }`}
                  >
                    {actionLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                    {actionLoading ? '处理中...' : '确认'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, highlight, accent }: {
  label: string;
  value: string;
  highlight?: boolean;
  accent?: boolean;
}) {
  return (
    <div className={`p-5 lg:p-6 rounded-3xl flex flex-col justify-between h-32 lg:h-36 relative overflow-hidden shadow-sm transition-transform hover:scale-[1.02] ${
      highlight ? 'bg-mahogany text-white shadow-mahogany/20' : 'bg-white text-midnight border border-gray-100'
    }`}>
      {highlight && <CheckSquare className="absolute -right-4 -bottom-4 text-white opacity-10 w-20 h-20 lg:w-24 lg:h-24" />}
      <p className={`text-[10px] lg:text-sm font-bold uppercase tracking-wider ${highlight ? 'text-white/70' : 'text-stony'}`}>{label}</p>
      <h3 className={`text-2xl lg:text-3xl font-display font-extrabold ${accent ? 'text-mahogany' : ''}`}>{value}</h3>
    </div>
  );
}

interface ApprovalItemProps {
  person?: { name?: string; student_id?: string } | null;
  created_at?: string;
  reason?: string;
  risk_level?: string;
  alert?: boolean;
  status?: string;
  id?: string;
  type?: string;
  onAction?: (type: 'approve' | 'reject') => void;
  actionLoading?: boolean;
}

function ApprovalItem({
  person,
  created_at,
  reason,
  risk_level: riskLevelProp,
  alert: alertProp,
  status,
  id: _id,
  type: _type,
  onAction,
  actionLoading,
  ...props
}: ApprovalItemProps) {
  const riskLevel = (props as Record<string, unknown>).risk_level as string || riskLevelProp || 'low';
  const isAlert = (props as Record<string, unknown>).alert as boolean || alertProp || false;
  const timeStr = created_at
    ? new Date(created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <motion.div
      whileHover={{ scale: 1.002, backgroundColor: '#ffffff' }}
      className="group bg-white/60 hover:bg-white hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300 rounded-2xl p-4 lg:p-5 flex flex-col md:flex-row items-start md:items-center gap-4 lg:gap-6 border border-gray-100"
    >
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100 group-hover:border-mahogany/20 transition-colors">
          <div className="w-full h-full bg-mahogany/10 flex items-center justify-center text-mahogany font-bold text-sm">
            {person?.name?.charAt(0) || '?'}
          </div>
        </div>
        <div className="md:hidden flex-1">
          <h4 className="text-sm font-display font-extrabold text-midnight truncate">{person?.name || '未知'}</h4>
          <p className="text-[9px] text-stony font-bold truncate uppercase tracking-tighter">{person?.student_id || ''}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-8 lg:gap-12 w-full">
        <div className="hidden md:flex items-center gap-8 lg:gap-12 flex-1">
          <div className="w-24 lg:w-32">
            <h4 className="text-sm lg:text-base font-display font-extrabold text-midnight truncate">{person?.name || '未知'}</h4>
            <p className="text-[9px] text-stony font-bold truncate uppercase tracking-tighter">{person?.student_id || ''}</p>
          </div>
          <div className="flex-1">
            <p className="text-[9px] text-stony font-bold uppercase mb-0.5 tracking-wider">时间详情</p>
            <p className="text-[10px] lg:text-xs font-bold text-midnight truncate">{timeStr}</p>
          </div>
          <div className="flex-[2]">
            <p className="text-[9px] text-stony font-bold uppercase mb-0.5 tracking-wider">事由详情</p>
            <p className={`text-[10px] lg:text-xs truncate font-medium ${isAlert ? 'text-red-500 font-bold' : 'text-stony italic'}`}>
              {reason}
            </p>
          </div>
        </div>

        <div className="md:hidden grid grid-cols-2 gap-4 w-full text-[10px]">
          <div>
            <p className="text-[8px] text-stony font-bold uppercase mb-0.5">时间</p>
            <p className="font-bold text-midnight truncate">{timeStr}</p>
          </div>
          <div>
            <p className="text-[8px] text-stony font-bold uppercase mb-0.5">事由</p>
            <p className={`truncate font-medium ${isAlert ? 'text-red-500 font-bold' : 'text-stony italic'}`}>{reason}</p>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-4 lg:gap-6 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-50 md:border-none">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] lg:text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${
            riskLevel === 'high' ? 'text-red-500 bg-red-50' : 'text-emerald-600 bg-emerald-50'
          }`}>
            {riskLevel === 'high' ? <AlertTriangle size={10} /> : <Verified size={10} />}
            AI {riskLevel === 'high' ? '高' : '低'}
          </div>

          <div className="hidden md:block h-8 w-px bg-gray-100"></div>

          <div className="flex items-center gap-2 lg:gap-3">
            <button
              onClick={() => onAction?.('reject')}
              disabled={!!actionLoading || status !== 'pending'}
              className="w-10 h-10 rounded-xl bg-gray-50 text-stony hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-inner active:scale-95 disabled:opacity-50"
            >
              <X size={18} />
            </button>
            <button
              onClick={() => onAction?.('approve')}
              disabled={!!actionLoading || status !== 'pending'}
              className="h-10 px-4 lg:px-6 rounded-xl bg-mahogany text-white font-bold shadow-lg shadow-mahogany/10 hover:shadow-mahogany/20 hover:scale-[1.02] active:scale-95 text-xs lg:text-sm whitespace-nowrap flex items-center gap-2 disabled:opacity-50"
            >
              {actionLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              通过审阅
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
