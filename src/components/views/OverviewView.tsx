import { TrendingUp, AlertTriangle, Zap, Fingerprint, ChevronRight, Sparkles, Users, GraduationCap, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';

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

interface PersonStats {
  total: number;
  student_count: number;
  teacher_count: number;
  face_registered_count: number;
  face_pending_count: number;
  face_completion_rate: number;
  attendance_rate: number;
}

interface Task {
  id: string;
  icon: any;
  title: string;
  level: string;
  desc: string;
  time: string;
  type: 'error' | 'warning' | 'info';
}

export default function OverviewView({
  briefingData,
  stats,
  personStats,
  tasks = [],
  searchQuery = '',
  onViewAllTasks
}: {
  briefingData?: BriefingData;
  stats?: StatDonut[];
  personStats?: PersonStats;
  tasks?: Task[];
  searchQuery?: string;
  onViewAllTasks?: () => void;
}) {
  // Default empty shell logic for development
  const displayBriefing = briefingData || {
    title: "AI 每日晨报",
    content: "暂无今日简报数据，请在系统后台进行配置或等待系统自动生成...",
    tags: []
  };

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayStats = stats || [
    {
      label: "人脸录入完成率",
      percentage: 0,
      completedText: "Completed",
      subStats: [{ label: "已注册", value: "-" }, { label: "待录入", value: "-" }],
      colorClass: "text-mahogany"
    },
    {
      label: "今日出勤分布",
      percentage: 0,
      completedText: "Attended",
      subStats: [{ label: "在校生", value: "-" }, { label: "教职工", value: "-" }],
      colorClass: "text-midnight"
    }
  ];

  return (
    <div className="space-y-6 lg:space-y-10 max-w-7xl mx-auto">
      {/* --- AI Daily Briefing Banner --- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-mahogany to-[#5a2a29] rounded-3xl p-6 lg:p-10 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start gap-6 lg:gap-8">
          <div className="bg-white/20 p-4 lg:p-5 rounded-2xl backdrop-blur-md shadow-inner flex-shrink-0">
            <Sparkles className="text-white" size={32} />
          </div>
          <div className="space-y-4">
            <h2 className="text-xl lg:text-2xl font-display font-extrabold tracking-tight">{displayBriefing.title}</h2>
            <div className="max-w-4xl">
              <p className="text-base lg:text-xl leading-relaxed font-medium opacity-90 border-l-2 border-white/30 pl-4 lg:pl-6">
                {displayBriefing.content}
              </p>
            </div>
            {displayBriefing.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {displayBriefing.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-white/10 rounded-full text-[10px] lg:text-xs font-bold border border-white/20 hover:bg-white/20 transition-colors cursor-default whitespace-nowrap">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- Analytics Stats --- */}
      <section className="grid grid-cols-12 gap-6 lg:gap-8">
        {displayStats.map((stat, idx) => (
          <div key={idx} className="col-span-12 md:col-span-6 lg:col-span-4 bg-white rounded-3xl p-6 lg:p-8 flex flex-col items-center text-center shadow-sm border border-gray-100">
            <h3 className="text-base lg:text-lg font-display font-bold text-midnight mb-6 lg:mb-10">{stat.label}</h3>
            <div className="relative flex items-center justify-center">
              <svg className="w-40 h-40 lg:w-52 lg:h-52 transform -rotate-90">
                <circle className="text-gray-100" cx="50%" cy="50%" fill="transparent" r="40%" stroke="currentColor" strokeWidth="6%" />
                <motion.circle 
                  initial={{ strokeDashoffset: 552 }}
                  animate={{ strokeDashoffset: 552 * (1 - stat.percentage / 100) }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: idx * 0.2 }}
                  className={stat.colorClass} 
                  cx="50%" cy="50%" fill="transparent" r="40%" stroke="currentColor" strokeWidth="6%" 
                  strokeDasharray="552.6"
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl lg:text-5xl font-display font-extrabold text-midnight tracking-tighter">{stat.percentage}%</span>
                <span className="text-[10px] font-bold text-stony uppercase tracking-[0.2em] mt-1">{stat.completedText}</span>
              </div>
            </div>
            <div className="mt-6 lg:mt-10 grid grid-cols-2 gap-6 lg:gap-10 w-full pt-6 lg:pt-8 border-t border-gray-50">
              {stat.subStats.map((sub, sIdx) => (
                <div key={sIdx}>
                  <p className="text-[10px] text-stony font-bold uppercase mb-1">{sub.label}</p>
                  <p className="text-xl lg:text-2xl font-display font-extrabold text-midnight truncate">{sub.value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Featured Campus View Card - Structural Placeholder */}
        <div className="col-span-12 lg:col-span-4 group relative overflow-hidden rounded-3xl shadow-xl aspect-video lg:aspect-auto min-h-[300px]">
          <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center text-stony text-sm font-bold">
            监控视频流加载中...
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-midnight/90 via-midnight/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6 lg:p-8 w-full">
            <p className="text-[10px] font-bold text-white/60 mb-2 uppercase tracking-[0.2em]">Real-time Feed</p>
            <h4 className="text-xl lg:text-2xl font-display font-extrabold text-white mb-4">实时监控点位</h4>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full w-fit group-hover:bg-white/20 transition-all">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
              <span className="text-xs font-bold text-white/90">连接状态：就绪</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- Campus Personnel Summary (real data from API) --- */}
      {personStats && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, label: '全校总人数', value: personStats.total, color: 'bg-blue-50 text-blue-600' },
            { icon: GraduationCap, label: '学生人数', value: personStats.student_count, color: 'bg-green-50 text-green-600' },
            { icon: UserCheck, label: '教职工人数', value: personStats.teacher_count, color: 'bg-amber-50 text-amber-600' },
            { icon: Fingerprint, label: '人脸已录入', value: personStats.face_registered_count, color: 'bg-purple-50 text-purple-600' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                <item.icon size={22} />
              </div>
              <div>
                <p className="text-[10px] text-stony font-bold uppercase tracking-wider">{item.label}</p>
                <p className="text-2xl font-display font-extrabold text-midnight mt-0.5">{item.value}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* --- Urgent Tasks --- */}
      <section className="space-y-6">
        <div className="flex items-end justify-between px-2">
          <div className="space-y-1">
            <h2 className="text-2xl lg:text-3xl font-display font-extrabold text-midnight tracking-tight">紧急待办</h2>
            <p className="text-stony font-medium text-sm">需要立即处理的高风险异常告警</p>
          </div>
          <button 
            onClick={onViewAllTasks}
            className="text-mahogany text-sm font-bold flex items-center gap-1 hover:translate-x-1 transition-transform group"
          >
            查看全部 <ChevronRight className="group-hover:translate-x-1 transition-transform" size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskItem key={task.id} {...task} />
            ))
          ) : (
            <div className="p-12 bg-white rounded-3xl border border-gray-100 border-dashed flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-stony mb-4">
                <Sparkles size={32} />
              </div>
              <h4 className="font-display font-bold text-midnight">暂无匹配的待办</h4>
              <p className="text-sm text-stony mt-1">没有找到符合搜索条件的告警信息。</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function TaskItem({ 
  icon: Icon, 
  title, 
  level, 
  desc, 
  time, 
  type 
}: any) {
  const colors: Record<string, string> = {
    error: 'border-red-500 bg-red-50 text-red-600',
    warning: 'border-mahogany bg-[#5a2a29]/5 text-mahogany',
    info: 'border-midnight bg-midnight/5 text-midnight'
  };

  const selectedColor = colors[type] || colors.info;

  return (
    <motion.div 
      whileHover={{ scale: 1.01, x: 5, backgroundColor: '#ffffff' }}
      className={`group bg-white p-5 lg:p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between shadow-sm border-l-4 transition-all ${selectedColor.split(' ')[0]} border border-gray-100 hover:shadow-xl hover:shadow-gray-200/40 gap-4 md:gap-0`}
    >
      <div className="flex items-center gap-4 lg:gap-6 w-full md:w-auto">
        <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-inner ${selectedColor.split(' ').slice(1).join(' ')}`}>
          <Icon size={24} />
        </div>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h4 className="font-display font-extrabold text-midnight text-sm lg:text-base">{title}</h4>
            <span className={`px-2 py-0.5 text-[8px] lg:text-[9px] font-black rounded-lg uppercase tracking-wider ${selectedColor.split(' ').slice(2).join(' ')} ring-1 ring-current/20`}>
              {level}
            </span>
          </div>
          <p className="text-xs lg:text-sm text-stony mt-1 font-medium line-clamp-1">{desc}</p>
        </div>
      </div>
      <div className="flex items-center justify-between md:justify-end gap-6 lg:gap-8 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-50 md:border-none">
        <div className="text-left md:text-right">
          <p className="text-[9px] lg:text-[10px] text-stony font-bold uppercase tracking-wider mb-0.5 lg:mb-1">触发时间</p>
          <p className="text-xs lg:text-sm font-display font-extrabold text-midnight">{time}</p>
        </div>
        <button className={`px-6 lg:px-8 py-2.5 lg:py-3 rounded-full text-xs lg:text-sm font-bold transition-all active:scale-95 shadow-lg whitespace-nowrap ${
          type === 'error' ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-midnight text-white shadow-midnight/20 hover:bg-mahogany hover:shadow-mahogany/20'
        }`}>
          {type === 'error' ? '立即处理' : type === 'warning' ? '查看详情' : '处理'}
        </button>
      </div>
    </motion.div>
  );
}

