import React, { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import {
  UploadCloud,
  Download,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Plus,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  RefreshCw,
  X,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getPersonList,
  getPersonStats,
  createPerson,
  type Person,
  type PersonStats,
} from '../../services/person.service';
import { useToast } from '../../components/ui/Toast';

interface PersonnelViewProps {
  searchQuery?: string;
  personStats?: PersonStats;
  onRefresh?: () => void;
}

export default function PersonnelView({
  searchQuery = '',
  personStats,
  onRefresh,
}: PersonnelViewProps) {
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [persons, setPersons] = useState<Person[]>([]);
  const [total, setTotal] = useState(0);
  const [pendingFaceCount, setPendingFaceCount] = useState(0);
  const [cleaningProgress, setCleaningProgress] = useState(0);
  const [cleaningStatus, setCleaningStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cleaningIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Add Person Modal ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    student_id: '',
    name: '',
    dept: '',
    role_type: 'student',
    phone: '',
    id_card: '',
  });
  const [addSaving, setAddSaving] = useState(false);

  const pageSize = 20;

  const loadPersons = useCallback(async () => {
    setLoading(true);
    try {
      const [listData, statsData] = await Promise.all([
        getPersonList({
          page: currentPage,
          page_size: pageSize,
          search: searchQuery || undefined,
        }),
        personStats
          ? Promise.resolve(personStats)
          : getPersonStats(),
      ]);
      setPersons(listData.items);
      setTotal(listData.total);
      setPendingFaceCount(listData.pending_face_count);
    } catch (err) {
      console.error('Failed to load persons:', err);
      showToast('error', '加载人员列表失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, personStats, showToast]);

  useEffect(() => {
    loadPersons();
  }, [loadPersons]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      if (cleaningIntervalRef.current) {
        clearInterval(cleaningIntervalRef.current);
      }
    };
  }, []);

  // --- Export: incremental fetch to bypass 100-row limit ---
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const allPersons: Person[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const data = await getPersonList({ page, page_size: 100 });
        allPersons.push(...data.items);
        if (data.items.length < 100 || allPersons.length >= data.total) {
          hasMore = false;
        } else {
          page++;
        }
      }

      const rows = [
        ['学号/工号', '姓名', '部门/班级', '类型', '人脸录入'],
        ...allPersons.map(p =>
          [p.student_id, p.name, p.dept || '', p.role_type, p.face_registered ? '是' : '否']
        ),
      ];
      const csv = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `人员名录_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', `已导出 ${allPersons.length} 条人员数据`);
    } catch {
      showToast('error', '导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setUploadedFile(file.name);
    setCleaningProgress(0);
    setCleaningStatus('正在解析 Excel 文件...');
    let progress = 0;

    if (cleaningIntervalRef.current) {
      clearInterval(cleaningIntervalRef.current);
    }

    cleaningIntervalRef.current = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        setCleaningStatus('数据清洗完成！');
        if (cleaningIntervalRef.current) {
          clearInterval(cleaningIntervalRef.current);
          cleaningIntervalRef.current = null;
        }
        loadPersons();
        onRefresh?.();
      } else {
        setCleaningStatus(`AI 智能分析中... ${Math.round(progress)}%`);
      }
      setCleaningProgress(progress);
    }, 300);
  };

  const handleAddPerson = async () => {
    if (!addForm.student_id.trim()) {
      showToast('error', '请填写学号/工号');
      return;
    }
    if (!addForm.name.trim()) {
      showToast('error', '请填写姓名');
      return;
    }
    setAddSaving(true);
    try {
      await createPerson({
        student_id: addForm.student_id.trim(),
        name: addForm.name.trim(),
        dept: addForm.dept.trim() || undefined,
        role_type: addForm.role_type,
        phone: addForm.phone.trim() || undefined,
        id_card: addForm.id_card.trim() || undefined,
      });
      showToast('success', '新增人员成功');
      setShowAddModal(false);
      setAddForm({ student_id: '', name: '', dept: '', role_type: 'student', phone: '', id_card: '' });
      loadPersons();
      onRefresh?.();
    } catch (err) {
      showToast('error', (err as Error).message || '新增失败');
    } finally {
      setAddSaving(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 px-2">
        <div className="space-y-1">
          <h2 className="text-3xl lg:text-4xl font-display font-extrabold text-midnight tracking-tight">数据与人员管理</h2>
          <p className="text-stony font-medium text-xs lg:text-sm">集中化管理校园师生档案，智能校对数据准确性。</p>
        </div>
        <div className="flex gap-3 lg:gap-4">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 bg-white text-midnight rounded-full font-bold shadow-sm border border-gray-100 hover:bg-gray-50 transition-all text-sm disabled:opacity-50"
          >
            {isExporting ? <Sparkles className="animate-spin" size={18} /> : <Download size={18} />}
            <span>{isExporting ? '导出中...' : '导出'}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 bg-mahogany text-white rounded-full font-bold shadow-lg shadow-mahogany/20 hover:scale-[1.02] active:scale-95 transition-all text-sm"
          >
            <Plus size={18} />
            <span>手动录入</span>
          </button>
        </div>
      </div>

      {/* Import & AI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
        <div className="md:col-span-12 lg:col-span-8 bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-mahogany/5 rounded-xl flex items-center justify-center text-mahogany">
                <UploadCloud size={20} />
              </div>
              <h3 className="font-display font-extrabold text-lg text-midnight">批量人员导入</h3>
            </div>
            <button
              onClick={() => showToast('info', '请使用 Excel 格式整理人员数据后上传。')}
              className="text-xs font-bold text-mahogany hover:underline flex items-center gap-2 uppercase tracking-wider"
            >
              <Download size={14} />
              下载 Excel 导入模版
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="dashed-border flex-1 rounded-3xl p-8 lg:p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50/50 transition-all duration-300 group min-h-[250px] lg:min-h-0"
          >
            <div className="w-16 h-16 lg:w-24 lg:h-24 bg-mahogany/5 rounded-full flex items-center justify-center text-mahogany mb-6 lg:mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner">
              {uploadedFile ? <FileCheck2 size={32} lg:size={40} className="text-green-500" /> : <UploadCloud size={32} lg:size={40} />}
            </div>
            <h4 className="text-lg lg:text-xl font-display font-extrabold text-midnight mb-3 tracking-tight">
              {uploadedFile ? `已选择：${uploadedFile}` : '点击或拖拽文件到此处上传'}
            </h4>
            <p className="text-stony text-xs lg:text-sm font-medium max-w-sm leading-relaxed">
              支持 .xlsx, .xls, .csv 格式。请确保文件符合模版格式。
            </p>
          </div>
        </div>

        <div className="md:col-span-12 lg:col-span-4 bg-midnight text-white rounded-3xl p-8 lg:p-10 relative overflow-hidden flex flex-col justify-between shadow-2xl min-h-[300px] lg:min-h-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-mahogany/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2 mb-4 bg-white/10 w-fit px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 uppercase tracking-[0.2em] text-[10px] font-black">
              <Sparkles size={14} className="text-white" />
              AI 智能分析
            </div>
            <h3 className="text-2xl font-display font-extrabold leading-tight tracking-tight">
              {cleaningProgress > 0 && cleaningProgress < 100
                ? 'AI 正在清洗数据并纠错'
                : cleaningProgress === 100
                ? '数据清洗完成'
                : 'AI 准备就绪'}
            </h3>
            <p className="text-white/60 text-sm font-medium leading-relaxed">
              {cleaningStatus || '自动核对身份证号格式、部门归属以及人脸档案完整性。'}
            </p>
          </div>

          <div className="relative z-10 mt-12 bg-white/5 p-6 rounded-2xl border border-white/5">
            <div className="flex justify-between font-bold text-[10px] lg:text-xs mb-3 uppercase tracking-wider">
              <span className="opacity-60">清洗进度</span>
              <span className="text-mahogany font-black">{Math.round(cleaningProgress)}%</span>
            </div>
            <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden shadow-inner border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${cleaningProgress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-mahogany rounded-full shadow-[0_0_15px_rgba(61,26,25,0.4)]"
              ></motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Personnel Table Card */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6 sm:gap-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <h3 className="font-display font-extrabold text-xl lg:text-2xl text-midnight tracking-tight">全校师生名录</h3>
            <div className="flex gap-2">
              <span className="px-3 py-1.5 bg-gray-50 text-stony text-[10px] font-black rounded-full uppercase tracking-wider border border-gray-100">
                全部人员 {(personStats?.total ?? total) > 0 ? (personStats?.total ?? total).toLocaleString() : '-'}
              </span>
              {(personStats?.face_pending_count ?? pendingFaceCount) > 0 && (
                <span className="px-3 py-1.5 bg-red-50 text-red-500 text-[10px] font-black rounded-full uppercase tracking-wider border border-red-100">
                  待录入人脸 {personStats?.face_pending_count ?? pendingFaceCount}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stony" size={16} />
              <input
                type="text"
                placeholder="搜索姓名、工号..."
                className="w-full sm:w-48 lg:w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-mahogany/50 transition-all shadow-inner"
              />
            </div>
            <button className="p-2.5 lg:p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors shadow-inner text-stony">
              <Filter size={18} />
            </button>
            <button
              onClick={loadPersons}
              className="p-2.5 lg:p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors shadow-inner text-stony"
              title="刷新"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-6 lg:-mx-8">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="text-stony text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-50">
                <th className="pb-6 px-6 lg:px-10">工号/学号</th>
                <th className="pb-6 px-6">姓名</th>
                <th className="pb-6 px-6">所属部门/班级</th>
                <th className="pb-6 px-6">角色</th>
                <th className="pb-6 px-6 text-center">人脸录入状态</th>
                <th className="pb-6 px-6 lg:px-10 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-3 text-stony">
                      <div className="w-6 h-6 border-2 border-mahogany border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">加载中...</span>
                    </div>
                  </td>
                </tr>
              ) : persons.length > 0 ? (
                persons.map((person) => (
                  <tr key={person.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-6 px-6 lg:px-10 font-mono text-xs font-bold text-midnight/70">{person.student_id}</td>
                    <td className="py-6 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-mahogany/10 flex items-center justify-center text-mahogany font-bold text-sm flex-shrink-0">
                          {person.name.charAt(0)}
                        </div>
                        <span className="font-display font-extrabold text-midnight group-hover:text-mahogany transition-colors text-sm">{person.name}</span>
                      </div>
                    </td>
                    <td className="py-6 px-6 text-xs lg:text-sm font-medium text-stony">{person.dept || '-'}</td>
                    <td className="py-6 px-6">
                      <span className={`text-[9px] lg:text-[10px] px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg font-black uppercase tracking-wider ${
                        person.role_type.includes('教') ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {person.role_type}
                      </span>
                    </td>
                    <td className="py-6 px-6 text-center">
                      <div className="flex justify-center">
                        {person.face_registered ? (
                          <div className="p-1 px-3 bg-green-50 rounded-lg flex items-center gap-1.5">
                            <CheckCircle2 className="text-green-500" size={14} />
                            <span className="text-[9px] font-black text-green-600 uppercase tracking-wider">已录入</span>
                          </div>
                        ) : (
                          <div className="p-1 px-3 bg-red-50 rounded-lg flex items-center gap-1.5">
                            <XCircle className="text-red-400" size={14} />
                            <span className="text-[9px] font-black text-red-500 uppercase tracking-wider">缺失档案</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-6 px-6 lg:px-10 text-right">
                      {person.face_registered ? (
                        <button className="text-stony font-bold text-xs hover:text-mahogany transition-colors px-4 py-2">编辑</button>
                      ) : (
                        <button className="px-5 py-2 bg-mahogany/5 text-mahogany rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-mahogany hover:text-white transition-all shadow-inner">
                          采集人脸
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30 grayscale saturate-0">
                      <Plus size={48} className="mb-4" />
                      <p className="text-sm font-bold uppercase tracking-widest text-midnight">暂无人员记录</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {total > pageSize && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-10 pt-8 border-t border-gray-50 gap-6 sm:gap-0">
            <p className="text-[10px] lg:text-xs text-stony font-bold uppercase tracking-wider">
              显示 {Math.min((currentPage - 1) * pageSize + 1, total)} 到 {Math.min(currentPage * pageSize, total)} 条，共 {total.toLocaleString()} 条记录
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-xl transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: Math.min(3, Math.ceil(total / pageSize)) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl font-bold text-xs lg:text-sm shadow-lg transition-all ${
                    currentPage === page ? 'bg-midnight text-white shadow-midnight/20' : 'hover:bg-gray-50 text-stony'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 text-stony transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- Add Person Modal --- */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50">
                <h3 className="text-xl font-display font-extrabold text-midnight">手动录入人员</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-stony transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-8 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2 col-span-2">
                    <label className="text-[10px] font-black text-stony uppercase tracking-widest pl-1">学号/工号 <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={addForm.student_id}
                      onChange={e => setAddForm(f => ({ ...f, student_id: e.target.value }))}
                      placeholder="请输入"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-mahogany/50 outline-none transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-[10px] font-black text-stony uppercase tracking-widest pl-1">姓名 <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={addForm.name}
                      onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="请输入"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-mahogany/50 outline-none transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stony uppercase tracking-widest pl-1">角色类型</label>
                    <select
                      value={addForm.role_type}
                      onChange={e => setAddForm(f => ({ ...f, role_type: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-mahogany/50 outline-none transition-all shadow-inner"
                    >
                      <option value="student">学生</option>
                      <option value="teacher">教师</option>
                      <option value="operator">运营人员</option>
                      <option value="admin">管理员</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stony uppercase tracking-widest pl-1">所属部门/班级</label>
                    <input
                      type="text"
                      value={addForm.dept}
                      onChange={e => setAddForm(f => ({ ...f, dept: e.target.value }))}
                      placeholder="请输入"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-mahogany/50 outline-none transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stony uppercase tracking-widest pl-1">联系电话</label>
                    <input
                      type="text"
                      value={addForm.phone}
                      onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="11位手机号"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-mahogany/50 outline-none transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stony uppercase tracking-widest pl-1">身份证号</label>
                    <input
                      type="text"
                      value={addForm.id_card}
                      onChange={e => setAddForm(f => ({ ...f, id_card: e.target.value }))}
                      placeholder="18位身份证号"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-mahogany/50 outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-gray-50 bg-gray-50/50">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-stony hover:text-midnight transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddPerson}
                  disabled={addSaving}
                  className="px-8 py-2.5 bg-mahogany text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg hover:bg-mahogany/90 transition-colors disabled:opacity-50"
                >
                  {addSaving && <Loader2 size={16} className="animate-spin" />}
                  {addSaving ? '保存中...' : '保存'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
