import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  CheckCircle,
  Clock,
  Activity,
  Sparkles,
  Download,
  FileText,
  Printer,
  ChevronDown,
} from "lucide-react";
import { fetchSuperDashboard } from "../../services/dashboardService";
import { analyzeSystemHealth } from "../../services/geminiService";

/* =====================
   Types
===================== */

type LearningPoint = {
  name: string;
  active: number;
};

type RecentActivity = {
  message: string;
  time: string;
};

type DashboardData = {
  activeLearners: number;
  completionRate: number;
  averageSession: number;
  systemLoad: number[];
  recentActivities: RecentActivity[];
  learningActivityGraph: LearningPoint[];
};

/* =====================
   Component
===================== */

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState("Analyzing system health…");
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await fetchSuperDashboard();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    if (!data) return;

    analyzeSystemHealth({
      activeLearners: data.activeLearners,
      completionRate: `${data.completionRate}%`,
      avgSession: `${data.averageSession ?? 0}m`,
    }).then(setAiInsight);
  }, [data]);

  /* =====================
     Export handlers
  ===================== */

  const handleExportCSV = () => {
    if (!data) return;

    const rows = [
      ["Metric", "Value"],
      ["Active Learners", data.activeLearners],
      ["Completion Rate", `${data.completionRate}%`],
      ["Average Session", `${data.averageSession ?? 0}m`],
      ["System Load", `${data.systemLoad.length}%`],
      [],
      ["Day", "Active Learners"],
      ...data.learningActivityGraph.map((d) => [d.name, d.active]),
    ];

    const csv =
      "data:text/csv;charset=utf-8," + rows.map((r) => r.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "dashboard_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowExport(false);
  };

  const handlePrint = () => {
    window.print();
    setShowExport(false);
  };

  if (loading) {
    return <div className="p-8 text-slate-500">Loading dashboard…</div>;
  }

  if (!data) {
    return <div className="p-8 text-red-500">Dashboard unavailable</div>;
  }

  const courseStatusData = [
    { name: "Completed", value: data.completionRate },
    { name: "In Progress", value: 100 - data.completionRate },
    { name: "Not Started", value: 0 },
  ];

  const pieColors = ["#10b981", "#3b82f6", "#9ca3af"];

  const systemLoadValue = data.systemLoad?.length ?? 0;

  const recentActivities = data.recentActivities ?? [];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* =====================
          Header
      ===================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            System overview & learning performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date */}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border shadow-sm text-sm text-slate-600">
            <Clock size={16} className="text-slate-400" />
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>

          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setShowExport((v) => !v)}
              className="flex items-center gap-2 bg-brand-accent hover:bg-brand-accent-dark text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition"
            >
              <Download size={16} />
              Export
              <ChevronDown
                size={14}
                className={`transition-transform ${
                  showExport ? "rotate-180" : ""
                }`}
              />
            </button>

            {showExport && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border overflow-hidden z-20">
                <button
                  onClick={handleExportCSV}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <FileText size={16} className="text-brand-accent" />
                  Download CSV
                </button>
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 border-t"
                >
                  <Printer size={16} className="text-slate-500" />
                  Print / Save PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =====================
          AI Insight
      ===================== */}
     {/*<div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-brand-primary via-brand-primary-dark to-brand-primary-dark p-6 md:p-8 text-white shadow-lg">
        <div className="absolute -top-20 -right-20 opacity-10">
          <Sparkles size={260} />
        </div>

        <div className="relative flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur">
            <Sparkles className="text-yellow-300" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-purple-200 font-semibold">
              AI System Insight
            </p>
            <p className="text-lg md:text-xl font-medium leading-relaxed mt-1">
              {aiInsight}
            </p>
          </div>
        </div>
      </div>*/}

      {/* =====================
          Stats
      ===================== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Stat
          label="Active Learners"
          value={data.activeLearners}
          icon={<Users />}
        />
        <Stat
          label="Completion Rate"
          value={`${data.completionRate}%`}
          icon={<CheckCircle />}
        />
        <Stat
          label="Avg Session"
          value={`${data.averageSession ?? 0}m`}
          icon={<Clock />}
        />
        <Stat
          label="System Load"
          value={`${systemLoadValue}%`}
          icon={<Activity />}
        />
      </div>

      {/* =====================
          Charts
      ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Learning Activity</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.learningActivityGraph}>
              <defs>
                <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5a4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5a4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Area
                dataKey="active"
                type="monotone"
                stroke="#0ea5a4"
                strokeWidth={3}
                fill="url(#activityFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Course Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={courseStatusData}
                dataKey="value"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
              >
                {courseStatusData.map((_, i) => (
                  <Cell key={i} fill={pieColors[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* =====================
          Recent Activity
      ===================== */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>

        {recentActivities.length === 0 ? (
          <p className="text-sm text-slate-500">No recent activity</p>
        ) : (
          <ul className="space-y-4">
            {recentActivities.map((a, i) => (
              <li key={i} className="flex justify-between gap-4">
                <p className="text-sm text-slate-700">{a.message}</p>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {a.time}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

/* =====================
   Stat Card
===================== */

const Stat = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition">
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">{icon}</div>
    </div>
    <div className="text-3xl font-bold text-slate-900">{value}</div>
  </div>
);

export default Dashboard;
