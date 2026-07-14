import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ResponsiveContainer, AreaChart, Area, 
  XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, Key, ArrowUpRight, 
  Clock, Sparkles, ExternalLink, 
  Copy, Check, Plus, Cpu, Activity,
  Play, BookOpen, CheckCircle2,
  RefreshCw, Lock
} from 'lucide-react';

const apiTrafficData = [
  { time: '00:00', createQr: 420, listQrs: 890, getQr: 1240 },
  { time: '04:00', createQr: 310, listQrs: 650, getQr: 980 },
  { time: '08:00', createQr: 850, listQrs: 1420, getQr: 2150 },
  { time: '12:00', createQr: 1480, listQrs: 2310, getQr: 3410 },
  { time: '16:00', createQr: 1920, listQrs: 2890, getQr: 4120 },
  { time: '20:00', createQr: 1640, listQrs: 2410, getQr: 3890 },
  { time: '23:59', createQr: 980, listQrs: 1620, getQr: 2540 },
];

const activeApiKeysSample = [
  {
    id: 'key-1',
    name: 'Production E-Commerce Backend',
    prefix: 'dq_live_8f3a••••',
    permissions: ['create_qr', 'read_qr', 'update_qr', 'delete_qr'],
    lastUsed: '2 minutes ago',
    requestsToday: '14,820',
    status: 'active'
  },
  {
    id: 'key-2',
    name: 'iOS App & Retail POS Sync',
    prefix: 'dq_live_c91d••••',
    permissions: ['create_qr', 'read_qr'],
    lastUsed: '18 minutes ago',
    requestsToday: '8,410',
    status: 'active'
  },
  {
    id: 'key-3',
    name: 'Staging CI/CD Automation',
    prefix: 'dq_live_44eb••••',
    permissions: ['create_qr', 'delete_qr'],
    lastUsed: '3 hours ago',
    requestsToday: '1,290',
    status: 'active'
  },
  {
    id: 'key-4',
    name: 'Legacy Marketing Bot v1',
    prefix: 'dq_live_10fa••••',
    permissions: ['read_qr'],
    lastUsed: '5 days ago',
    requestsToday: '0',
    status: 'revoked'
  }
];

const recentApiLogs = [
  { id: 'req_983a', endpoint: 'POST /api/v1/qr/create', status: 201, latency: '38ms', key: 'Production E-Commerce...', time: 'Just now', ip: '54.210.84.12' },
  { id: 'req_983b', endpoint: 'GET /api/v1/qr/list?limit=50', status: 200, latency: '24ms', key: 'iOS App & Retail POS...', time: '12s ago', ip: '108.32.14.99' },
  { id: 'req_983c', endpoint: 'GET /api/v1/qr/spring-promo-26', status: 200, latency: '19ms', key: 'Production E-Commerce...', time: '45s ago', ip: '54.210.84.12' },
  { id: 'req_983d', endpoint: 'PUT /api/v1/qr/dev-api-doc', status: 200, latency: '42ms', key: 'Staging CI/CD...', time: '2m ago', ip: '34.201.112.45' },
  { id: 'req_983e', endpoint: 'POST /api/v1/keys/verify', status: 200, latency: '14ms', key: 'iOS App & Retail POS...', time: '3m ago', ip: '108.32.14.99' },
  { id: 'req_983f', endpoint: 'POST /api/v1/qr/create', status: 401, latency: '11ms', key: 'dq_live_invalid...', time: '5m ago', ip: '185.220.101.5' },
];

export function Dashboard() {
  const [timeRange, setTimeRange] = useState<'24H' | '7D' | '30D' | '90D'>('24H');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in-50 duration-500">
      {/* Top Banner / Welcome & API Intelligence Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950/50 p-6 rounded-2xl border border-zinc-800/80 shadow-2xl shadow-black/60">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="size-3 text-indigo-400 animate-pulse" />
              Developer API Telemetry Hub
            </span>
            <span className="text-zinc-500 text-xs flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
              Real-time edge monitoring
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            REST API & Telemetry Dashboard
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl">
            Track programmatic QR code generation, inspect live endpoint latency across 340+ edge regions, and manage secret API tokens with granular RBAC permissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/developer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold border border-zinc-700/60 transition-all shadow-md"
          >
            <Play className="size-4 text-indigo-400" />
            <span>Interactive Playground</span>
          </Link>
          <Link
            to="/developer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:opacity-95 active:scale-95 transition-all"
          >
            <Plus className="size-4" />
            <span>Generate API Key</span>
          </Link>
        </div>
      </div>

      {/* API KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total API Requests */}
        <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/60 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 size-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total API Requests (24h)</span>
            <div className="size-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Cpu className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight">48,290</span>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp className="size-3" />
              +42.8%
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">Peak: 3,410 req/hr at 12:00 UTC</p>
        </div>

        {/* Card 2: Active API Keys */}
        <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/60 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 size-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Active Secret Tokens</span>
            <div className="size-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Key className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight">4</span>
            <span className="flex items-center gap-1 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              SHA-256 Hashed
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">1 key revoked across all apps</p>
        </div>

        {/* Card 3: Avg Response Latency */}
        <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/60 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 size-24 bg-pink-500/5 rounded-full blur-2xl group-hover:bg-pink-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Avg. Edge Latency</span>
            <div className="size-8 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <Activity className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight">38ms</span>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              -6ms faster
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">99th percentile: 64ms across global CDN</p>
        </div>

        {/* Card 4: API Success Rate */}
        <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/60 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 size-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Endpoint Success Rate</span>
            <div className="size-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight">99.98%</span>
            <span className="flex items-center gap-1 text-xs font-bold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-700">
              SLA: 99.9%
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">12 unauthorized attempts blocked</p>
        </div>
      </div>

      {/* Main Charts & Telemetry Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: API Endpoint Traffic Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>API Endpoint Traffic Breakdown</span>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    REST v1.3
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">Real-time request volume categorized by API method and route</p>
              </div>
              <div className="flex items-center gap-1 bg-zinc-800/80 p-1 rounded-xl border border-zinc-700/50 self-start">
                {(['24H', '7D', '30D', '90D'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      timeRange === range
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts AreaChart for API endpoints */}
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={apiTrafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCreate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorList" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorGet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="createQr" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCreate)" name="POST /qr/create" />
                  <Area type="monotone" dataKey="listQrs" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorList)" name="GET /qr/list" />
                  <Area type="monotone" dataKey="getQr" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorGet)" name="GET /qr/:code" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium text-indigo-400">
                <span className="size-2.5 rounded-full bg-indigo-500" />
                POST /qr/create (24.1%)
              </span>
              <span className="flex items-center gap-1.5 font-medium text-pink-400">
                <span className="size-2.5 rounded-full bg-pink-500" />
                GET /qr/list (36.4%)
              </span>
              <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                <span className="size-2.5 rounded-full bg-emerald-500" />
                GET /qr/:code (39.5%)
              </span>
            </div>
            <Link to="/developer" className="text-indigo-400 hover:underline flex items-center gap-1 font-semibold">
              Open Interactive Playground <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Quick API Jump Cards & Security Status */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900/30 via-zinc-900 to-purple-900/20 border border-indigo-500/30 relative overflow-hidden shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Play className="size-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Interactive Sandbox</h4>
                <p className="text-xs text-zinc-400">Test live requests right in your browser</p>
              </div>
            </div>
            <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
              Select your API key, customize JSON request payloads, and execute real-time calls against your database with instant status codes.
            </p>
            <Link
              to="/developer"
              className="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/30"
            >
              <span>Launch Playground</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 space-y-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <BookOpen className="size-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">REST API Reference</h4>
                <p className="text-xs text-zinc-400">cURL, Node.js, Python, PHP, Go</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
              <span className="text-zinc-400">SDK Config & Docs</span>
              <Link to="/api-docs" className="text-purple-400 font-semibold hover:underline flex items-center gap-1">
                View Docs <ExternalLink className="size-3" />
              </Link>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex items-center gap-3 text-xs text-zinc-400">
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Lock className="size-4" />
            </div>
            <div>
              <p className="font-semibold text-zinc-200">Zero-Trust Key Storage</p>
              <p className="text-[11px] text-zinc-500">Only SHA-256 hashes are stored in DB.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active API Keys Table Overview */}
      <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Developer API Keys & Tokens</span>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                4 Active
              </span>
            </h3>
            <p className="text-xs text-zinc-400">Manage secret prefixes, inspect RBAC permissions, and revoke compromised tokens</p>
          </div>
          <Link
            to="/developer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-semibold shadow-md transition-all hover:opacity-95"
          >
            <Plus className="size-3.5" />
            <span>Manage All Keys in Portal</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="pb-3 pl-2">Key Label & Prefix</th>
                <th className="pb-3">Granular Permissions</th>
                <th className="pb-3">24h Requests</th>
                <th className="pb-3">Last Active</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-sm">
              {activeApiKeysSample.map((key) => (
                <tr key={key.id} className="hover:bg-zinc-800/40 transition-colors group">
                  <td className="py-4 pl-2">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-indigo-400 flex-shrink-0 group-hover:border-indigo-500/50 transition-colors">
                        <Key className="size-4" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-100 group-hover:text-indigo-400 transition-colors">
                          {key.name}
                        </p>
                        <p className="font-mono text-xs text-zinc-500">{key.prefix}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {key.permissions.map((perm) => (
                        <span key={perm} className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 font-mono font-bold text-zinc-200">
                    {key.requestsToday}
                  </td>
                  <td className="py-4 text-xs text-zinc-400 flex items-center gap-1.5">
                    <Clock className="size-3 text-zinc-500" />
                    <span>{key.lastUsed}</span>
                  </td>
                  <td className="py-4">
                    {key.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                        Revoked
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-right pr-2">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleCopy(key.prefix)}
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700/60 transition-all"
                        title="Copy Prefix"
                      >
                        {copiedKey === key.prefix ? (
                          <Check className="size-4 text-emerald-400" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </button>
                      <Link
                        to="/developer"
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700/60 transition-all"
                      >
                        Configure
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live API Telemetry & Request Logs */}
      <div className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <RefreshCw className="size-4 text-indigo-400 animate-spin" />
              <span>Live Endpoint Telemetry Logs</span>
            </h3>
            <p className="text-xs text-zinc-400">Real-time HTTP status codes, execution latency, and client origins</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-xs font-mono text-zinc-400 border border-zinc-700/60">
              Auto-refresh: ON
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="pb-3 pl-2">Req ID</th>
                <th className="pb-3">Endpoint & Method</th>
                <th className="pb-3">HTTP Status</th>
                <th className="pb-3">Latency</th>
                <th className="pb-3">API Key Name</th>
                <th className="pb-3">Client IP</th>
                <th className="pb-3 text-right pr-2">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs font-mono">
              {recentApiLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3.5 pl-2 text-zinc-500">{log.id}</td>
                  <td className="py-3.5 font-bold text-zinc-200">
                    <span className={`px-1.5 py-0.5 rounded mr-2 text-[10px] ${
                      log.endpoint.startsWith('POST') ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                      log.endpoint.startsWith('PUT') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {log.endpoint.split(' ')[0]}
                    </span>
                    <span className="text-zinc-300">{log.endpoint.split(' ')[1]}</span>
                  </td>
                  <td className="py-3.5">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                      log.status === 200 || log.status === 201 
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-red-500/15 text-red-400 border border-red-500/30'
                    }`}>
                      {log.status === 201 ? '201 Created' : log.status === 200 ? '200 OK' : `${log.status} Unauthorized`}
                    </span>
                  </td>
                  <td className="py-3.5 text-indigo-400 font-semibold">{log.latency}</td>
                  <td className="py-3.5 text-zinc-400 truncate max-w-[160px]">{log.key}</td>
                  <td className="py-3.5 text-zinc-500">{log.ip}</td>
                  <td className="py-3.5 text-right pr-2 text-zinc-500">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default Dashboard;
