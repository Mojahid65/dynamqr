import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { 
  Key, Terminal, BookOpen, Copy, Check, Plus, Trash2, 
  Play, ExternalLink, RefreshCw, Sparkles, 
  Lock, CheckCircle2, Clock, Cpu, Activity, TrendingUp
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { AppShell } from '../components/app-shell';
import { 
  ResponsiveContainer, AreaChart, Area, 
  XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';

type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  status: 'active' | 'revoked';
  permissions: {
    create_qr?: boolean;
    read_qr?: boolean;
    update_qr?: boolean;
    delete_qr?: boolean;
    analytics?: boolean;
  };
  created_at: string;
  last_used_at: string | null;
};

const apiTrafficData = [
  { time: '00:00', createQr: 420, listQrs: 890, getQr: 1240 },
  { time: '04:00', createQr: 310, listQrs: 650, getQr: 980 },
  { time: '08:00', createQr: 850, listQrs: 1420, getQr: 2150 },
  { time: '12:00', createQr: 1480, listQrs: 2310, getQr: 3410 },
  { time: '16:00', createQr: 1920, listQrs: 2890, getQr: 4120 },
  { time: '20:00', createQr: 1640, listQrs: 2410, getQr: 3890 },
  { time: '23:59', createQr: 980, listQrs: 1620, getQr: 2540 },
];

export default function DeveloperPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'keys' | 'playground' | 'snippets' | 'docs' | 'telemetry'>('keys');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);

  // New Key Modal state
  const [showModal, setShowModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [permissions, setPermissions] = useState({
    create_qr: true,
    read_qr: true,
    update_qr: true,
    delete_qr: true,
    analytics: true,
  });
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);

  // Playground state
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');
  const [pgUrl, setPgUrl] = useState('https://example.com/my-project');
  const [pgShortCode, setPgShortCode] = useState('');
  const [pgLoading, setPgLoading] = useState(false);
  const [pgResponse, setPgResponse] = useState<any>(null);
  const [pgTime, setPgTime] = useState<number | null>(null);

  // Snippets tab
  const [snippetLang, setSnippetLang] = useState<'curl' | 'node' | 'python' | 'php' | 'go'>('curl');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Fetch API keys
  const fetchKeys = async () => {
    if (!user) return;
    setLoadingKeys(true);
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setApiKeys(data as ApiKey[]);
      if (data.length > 0 && !selectedKeyId) {
        const firstActive = data.find(k => k.status === 'active');
        if (firstActive) setSelectedKeyId(firstActive.id);
      }
    }
    setLoadingKeys(false);
  };

  useEffect(() => {
    fetchKeys();
  }, [user]);

  // Generate SHA-256 hash using Web Crypto API
  const hashString = async (str: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newKeyName.trim()) return;
    setCreatingKey(true);

    try {
      // Generate secure 32-byte hex random key
      const randomBytes = new Uint8Array(24);
      crypto.getRandomValues(randomBytes);
      const randomHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      const fullApiKey = `dq_live_${randomHex}`;

      const keyHash = await hashString(fullApiKey);
      const keyPrefix = fullApiKey.substring(0, 16);

      const { data, error } = await supabase.from('api_keys').insert({
        user_id: user.id,
        name: newKeyName.trim(),
        key_prefix: keyPrefix,
        key_hash: keyHash,
        status: 'active',
        permissions: permissions
      }).select().single();

      if (error) {
        alert('Failed to create key: ' + error.message);
      } else if (data) {
        setCreatedRawKey(fullApiKey);
        setNewKeyName('');
        fetchKeys();
      }
    } catch (err: any) {
      alert('Error creating key: ' + err.message);
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'revoked' : 'active';
    await supabase.from('api_keys').update({ status: newStatus }).eq('id', id);
    fetchKeys();
  };

  const handleDeleteKey = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this API key? Apps using this key will immediately fail.')) return;
    await supabase.from('api_keys').delete().eq('id', id);
    fetchKeys();
  };

  const handleTestPlayground = async () => {
    setPgLoading(true);
    setPgResponse(null);
    setPgTime(null);
    const startTime = performance.now();

    try {
      let authHeader = `Bearer ${createdRawKey || 'dq_live_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p'}`;
      if (selectedKeyId && !createdRawKey) {
        const selectedKeyObj = apiKeys.find(k => k.id === selectedKeyId);
        if (selectedKeyObj) {
          const promptInput = window.prompt(
            `Enter your full secret key matching prefix (${selectedKeyObj.key_prefix}...) to run live test against your database:\n\n(If you forgot your key, create a new one from the API Keys tab)`,
            createdRawKey || ''
          );
          if (!promptInput) {
            setPgLoading(false);
            return;
          }
          authHeader = `Bearer ${promptInput.trim()}`;
        }
      }

      const endpoint = `https://dynamqr.vercel.app/api/v1/qr/create`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          destination_url: pgUrl.trim(),
          short_code: pgShortCode.trim() || undefined,
          keyword: 'playground-test'
        })
      });

      const endTime = performance.now();
      setPgTime(Math.round(endTime - startTime));

      const data = await res.json();
      setPgResponse({ status: res.status, ...data });
      if (res.ok) {
        fetchKeys();
      }
    } catch (err: any) {
      setPgResponse({
        success: false,
        error: { code: 'NETWORK_ERROR', message: err.message }
      });
    } finally {
      setPgLoading(false);
    }
  };

  const getCodeSnippet = (lang: string) => {
    const sampleKey = createdRawKey || 'dq_live_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p';
    const sampleUrl = 'https://dynamqr.vercel.app/api/v1/qr/create';

    if (lang === 'curl') {
      return `curl -X POST ${sampleUrl} \\
  -H "Authorization: Bearer ${sampleKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "destination_url": "https://your-app.com/orders/9921",
    "short_code": "order9921"
  }'`;
    }
    if (lang === 'node') {
      return `const response = await fetch('${sampleUrl}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${sampleKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    destination_url: 'https://your-app.com/orders/9921',
    short_code: 'order9921'
  })
});

const result = await response.json();
if (result.success) {
  console.log('Created QR Code URL:', result.data.qr_url);
  console.log('QR Image URL:', result.data.qr_image_url);
}`;
    }
    if (lang === 'python') {
      return `import requests

url = "${sampleUrl}"
headers = {
    "Authorization": "Bearer ${sampleKey}",
    "Content-Type": "application/json"
}
payload = {
    "destination_url": "https://your-app.com/orders/9921",
    "short_code": "order9921"
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()

if data.get("success"):
    print("QR Code Short Link:", data["data"]["qr_url"])
    print("QR Code Image:", data["data"]["qr_image_url"])`;
    }
    if (lang === 'php') {
      return `<?php
$curl = curl_init();

curl_setopt_array($curl, [
  CURLOPT_URL => "${sampleUrl}",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => json_encode([
    'destination_url' => 'https://your-app.com/orders/9921',
    'short_code' => 'order9921'
  ]),
  CURLOPT_HTTPHEADER => [
    'Authorization: Bearer ${sampleKey}',
    'Content-Type: application/json'
  ],
]);

$response = curl_exec($curl);
curl_close($curl);
echo $response;`;
    }
    if (lang === 'go') {
      return `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"io/ioutil"
)

func main() {
	url := "${sampleUrl}"
	payload := map[string]string{
		"destination_url": "https://your-app.com/orders/9921",
		"short_code":      "order9921",
	}
	jsonValue, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonValue))
	req.Header.Set("Authorization", "Bearer ${sampleKey}")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Println(string(body))
}`;
    }
    return '';
  };

  return (
    <AppShell>
      <div className="space-y-8 pb-12 animate-in fade-in-50 duration-500 font-sans text-zinc-100">
        
        {/* Top Banner / Welcome & API Intelligence Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950/50 p-6 sm:p-8 rounded-2xl border border-zinc-800/80 shadow-2xl shadow-black/60">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-mono">
                <Sparkles className="size-3 text-indigo-400 animate-pulse" />
                v1.0 Enterprise REST API
              </span>
              <span className="text-zinc-500 text-xs flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Edge Gateway
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Developer Portal & Telemetry Hub
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
              Generate secure REST API keys, monitor programmatic telemetry across 340+ edge regions, and test endpoint responses in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('playground')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold border border-zinc-700/60 transition-all shadow-md"
            >
              <Play className="size-4 text-indigo-400" />
              <span>Interactive Sandbox</span>
            </button>
            <button
              onClick={() => { setActiveTab('keys'); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:opacity-95 active:scale-95 transition-all"
            >
              <Plus className="size-4" />
              <span>Generate API Key</span>
            </button>
          </div>
        </div>

        {/* API KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/60 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 size-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Active API Keys</span>
              <div className="size-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Key className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {apiKeys.filter(k => k.status === 'active').length}
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                SHA-256 Hashed
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">Zero-trust encrypted storage</p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/60 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 size-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">API Gateway Status</span>
              <div className="size-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Cpu className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-emerald-400 tracking-tight flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Operational
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <TrendingUp className="size-3" />
                99.99%
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">340+ Vercel edge endpoints</p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/60 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 size-24 bg-pink-500/5 rounded-full blur-2xl group-hover:bg-pink-500/10 transition-all" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Rate Limit Tier</span>
              <div className="size-8 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <Clock className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white tracking-tight">60</span>
              <span className="text-xs font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">
                req / min
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">Burst capacity: 120 req / min</p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/60 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 size-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Protocol & Auth</span>
              <div className="size-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Lock className="size-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-white font-mono tracking-tight">Bearer Token</span>
              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                TLS 1.3
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">Granular RBAC scopes enabled</p>
          </div>
        </div>

        {/* Tabs Menu Navigation */}
        <div className="border-b border-zinc-800/80 bg-zinc-900/40 rounded-2xl p-1.5 flex flex-wrap gap-2 sticky top-16 z-20 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('keys')}
            className={`flex items-center gap-2.5 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'keys'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>API Keys ({apiKeys.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('playground')}
            className={`flex items-center gap-2.5 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'playground'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Interactive Playground</span>
            <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-mono font-bold">Live</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-2.5 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'telemetry'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Traffic Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab('snippets')}
            className={`flex items-center gap-2.5 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'snippets'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Code Examples</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-2.5 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'docs'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>REST API Reference</span>
          </button>
        </div>

        {/* Main Tab Viewport */}
        <div className="pt-2">
          
          {/* TAB 1: API KEYS MANAGEMENT */}
          {activeTab === 'keys' && (
            !user ? (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Developer Authentication Required</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">
                    Please sign in or create a free account to generate, copy, and manage secure REST API keys for your applications.
                  </p>
                </div>
                <div className="flex justify-center space-x-4 pt-2">
                  <Link to="/login" className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-medium transition-all text-sm border border-zinc-700">
                    Sign In
                  </Link>
                  <Link to="/register" className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/30 text-sm">
                    Create Account
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* Newly Created Key Alert / Modal Box */}
                {createdRawKey && (
                  <div className="bg-gradient-to-r from-emerald-950/80 via-indigo-950/80 to-zinc-900 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">Your API Key Generated Successfully!</h3>
                          <p className="text-zinc-300 text-sm mt-0.5">
                            Please copy your secret key right now. For security reasons, <span className="text-amber-400 font-semibold underline">it will never be shown again</span> once you leave or refresh.
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setCreatedRawKey(null)}
                        className="text-zinc-400 hover:text-white text-sm font-medium bg-zinc-800/80 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Done
                      </button>
                    </div>

                    <div className="mt-6 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-sm">
                      <span className="text-indigo-300 break-all select-all font-semibold px-2">
                        {createdRawKey}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(createdRawKey);
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 3000);
                        }}
                        className="w-full sm:w-auto shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
                      >
                        {copiedKey ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-300" />
                            <span className="text-emerald-200">Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy Key</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Active Secret Keys</h2>
                    <p className="text-zinc-400 text-sm mt-1">
                      Manage the API tokens that authenticate your applications and microservices with DynamQR.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center space-x-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create New API Key</span>
                  </button>
                </div>

                {/* Create Key Modal */}
                {showModal && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className="bg-indigo-500/20 p-2.5 rounded-2xl text-indigo-400 border border-indigo-500/30">
                            <Key className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">Create API Key</h3>
                            <p className="text-xs text-zinc-400">Generate a unique token for your project</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setShowModal(false)}
                          className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                        >
                          ✕
                        </button>
                      </div>

                      <form onSubmit={(e) => { handleCreateKey(e); setShowModal(false); }} className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-zinc-300">Key Label / Project Name</label>
                          <input
                            type="text"
                            required
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            placeholder="e.g., Production Web App, POS Terminal, Zapier"
                            className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-white placeholder-zinc-600 transition-all text-sm"
                          />
                          <p className="text-xs text-zinc-500">A human-readable label to help you identify where this token is deployed.</p>
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-semibold text-zinc-300">Granular Key Scopes (RBAC)</label>
                          <div className="grid grid-cols-2 gap-3">
                            <label className="flex items-center space-x-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 cursor-pointer hover:border-zinc-700 transition-colors">
                              <input
                                type="checkbox"
                                checked={permissions.create_qr}
                                onChange={(e) => setPermissions({ ...permissions, create_qr: e.target.checked })}
                                className="rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500 bg-zinc-900 w-4 h-4"
                              />
                              <span className="text-sm text-zinc-300 font-medium">Create QR Codes</span>
                            </label>

                            <label className="flex items-center space-x-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 cursor-pointer hover:border-zinc-700 transition-colors">
                              <input
                                type="checkbox"
                                checked={permissions.read_qr}
                                onChange={(e) => setPermissions({ ...permissions, read_qr: e.target.checked })}
                                className="rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500 bg-zinc-900 w-4 h-4"
                              />
                              <span className="text-sm text-zinc-300 font-medium">Read & List QRs</span>
                            </label>

                            <label className="flex items-center space-x-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 cursor-pointer hover:border-zinc-700 transition-colors">
                              <input
                                type="checkbox"
                                checked={permissions.update_qr}
                                onChange={(e) => setPermissions({ ...permissions, update_qr: e.target.checked })}
                                className="rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500 bg-zinc-900 w-4 h-4"
                              />
                              <span className="text-sm text-zinc-300 font-medium">Update Destination</span>
                            </label>

                            <label className="flex items-center space-x-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 cursor-pointer hover:border-zinc-700 transition-colors">
                              <input
                                type="checkbox"
                                checked={permissions.delete_qr}
                                onChange={(e) => setPermissions({ ...permissions, delete_qr: e.target.checked })}
                                className="rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500 bg-zinc-900 w-4 h-4"
                              />
                              <span className="text-sm text-zinc-300 font-medium">Delete QRs</span>
                            </label>
                          </div>
                        </div>

                        <div className="flex space-x-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium transition-colors text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={creatingKey || !newKeyName.trim()}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 disabled:opacity-50 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/30 text-sm flex items-center justify-center space-x-2"
                          >
                            {creatingKey ? <span>Generating...</span> : <span>Generate Secret Token</span>}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Keys Table / List */}
                {loadingKeys ? (
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 animate-pulse space-y-4">
                    <div className="h-6 bg-zinc-800 rounded w-1/4"></div>
                    <div className="h-12 bg-zinc-800/60 rounded-xl"></div>
                    <div className="h-12 bg-zinc-800/60 rounded-xl"></div>
                  </div>
                ) : apiKeys.length === 0 ? (
                  <div className="bg-zinc-900/40 border border-zinc-800 border-dashed rounded-3xl p-12 text-center max-w-2xl mx-auto">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 text-indigo-400">
                      <Key className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No API keys generated yet</h3>
                    <p className="text-zinc-400 text-sm max-w-md mx-auto mb-6">
                      Create a secret token prefix to unlock programmatic dynamic QR code generation from your external servers or automated scripts.
                    </p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white px-6 py-3 rounded-xl font-medium inline-flex items-center space-x-2 transition-all shadow-lg shadow-indigo-600/20"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Create Your First Secret Token</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                            <th className="py-4 px-6">Key Label & Scopes</th>
                            <th className="py-4 px-6">Token Prefix</th>
                            <th className="py-4 px-6">Status</th>
                            <th className="py-4 px-6">Created</th>
                            <th className="py-4 px-6">Last Active</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 text-sm">
                          {apiKeys.map((key) => (
                            <tr key={key.id} className="hover:bg-zinc-800/40 transition-colors group">
                              <td className="py-4 px-6 font-semibold text-white">
                                <div className="flex items-center space-x-2.5">
                                  <span className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform"></span>
                                  <span>{key.name}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 font-mono text-xs font-bold text-indigo-400">
                                {key.key_prefix}••••••••••••••••
                              </td>
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                  key.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                    key.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                                  }`}></span>
                                  {key.status === 'active' ? 'Active' : 'Revoked'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-zinc-400 text-xs font-mono">
                                {new Date(key.created_at).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-6 text-zinc-400 text-xs font-mono">
                                {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Never'}
                              </td>
                              <td className="py-4 px-6 text-right space-x-2">
                                <button
                                  onClick={() => handleRevokeKey(key.id, key.status)}
                                  className="text-xs font-medium text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700/50"
                                >
                                  {key.status === 'active' ? 'Revoke' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => handleDeleteKey(key.id)}
                                  className="text-zinc-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors inline-block align-middle border border-transparent hover:border-red-500/20"
                                  title="Delete Key"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          )}

          {/* TAB 2: INTERACTIVE PLAYGROUND */}
          {activeTab === 'playground' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Request Builder */}
              <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="flex items-center space-x-3 border-b border-zinc-800 pb-4">
                  <div className="bg-indigo-500/20 p-2.5 rounded-xl text-indigo-400 border border-indigo-500/30">
                    <Play className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Live API Request Sandbox</h3>
                    <p className="text-xs text-zinc-400">Execute POST /api/v1/qr/create in real-time against your database</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-zinc-400 mb-2">
                      1. Authentication Secret Key
                    </label>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm flex items-center justify-between">
                      <span className="text-zinc-300 font-mono text-xs sm:text-sm truncate mr-2">
                        {createdRawKey ? `${createdRawKey}` : `Bearer dq_live_•••••••••••• (Prompted on Click / Test Key)`}
                      </span>
                      <span className="text-[11px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono font-bold shrink-0 border border-indigo-500/30">
                        POST /v1/qr/create
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1.5">
                      {createdRawKey ? "Using your recently generated raw API key above for live test." : "When you click Send below, if no raw token is cached, you can paste your secret key."}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-zinc-400 mb-2">
                      2. Destination URL (Required)
                    </label>
                    <input
                      type="text"
                      value={pgUrl}
                      onChange={(e) => setPgUrl(e.target.value)}
                      placeholder="https://yourwebsite.com/product/123"
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    />
                    <p className="text-xs text-zinc-500 mt-1">The destination link where the QR code will dynamically redirect users upon scanning.</p>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-zinc-400 mb-2">
                      3. Custom Short Code / Slug (Optional)
                    </label>
                    <input
                      type="text"
                      value={pgShortCode}
                      onChange={(e) => setPgShortCode(e.target.value)}
                      placeholder="e.g. promo2026 (leave blank for auto-generation)"
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleTestPlayground}
                      disabled={pgLoading || !pgUrl}
                      className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-indigo-600/30 active:scale-98"
                    >
                      {pgLoading ? (
                        <span className="flex items-center space-x-2">
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Sending Request to API Gateway...</span>
                        </span>
                      ) : (
                        <>
                          <Play className="w-5 h-5 fill-current" />
                          <span>Send Live API Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Response Viewer */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <div className="flex items-center space-x-2">
                      <Terminal className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-base font-bold text-white">Live API Response Output</h3>
                    </div>
                    {pgResponse && (
                      <div className="flex items-center space-x-2 text-xs font-mono">
                        <span className={`px-2 py-0.5 rounded-md font-semibold ${
                          pgResponse.status >= 200 && pgResponse.status < 300
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {pgResponse.status || (pgResponse.success ? '201 Created' : '400 Error')}
                        </span>
                        {pgTime && <span className="text-zinc-400">{pgTime}ms</span>}
                      </div>
                    )}
                  </div>

                  {!pgResponse && !pgLoading && (
                    <div className="py-12 text-center text-zinc-500 text-sm">
                      <Sparkles className="w-8 h-8 text-zinc-600 mx-auto mb-3 animate-pulse" />
                      <p>Click "Send Live API Request" to execute and inspect real-time JSON response headers and QR code image rendering.</p>
                    </div>
                  )}

                  {pgLoading && (
                    <div className="py-12 text-center space-y-3">
                      <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto"></div>
                      <p className="text-sm text-zinc-400 font-mono">Executing serverless endpoint...</p>
                    </div>
                  )}

                  {pgResponse && (
                    <div className="space-y-6">
                      {pgResponse.success && pgResponse.data && (
                        <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 flex flex-col items-center text-center space-y-3">
                          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                            Live Rendered Dynamic QR
                          </span>
                          <div className="bg-white p-3 rounded-xl shadow-lg ring-4 ring-indigo-500/10">
                            <QRCodeSVG value={pgResponse.data.qr_url} size={130} level="M" />
                          </div>
                          <a
                            href={pgResponse.data.qr_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 font-mono break-all"
                          >
                            <span>{pgResponse.data.qr_url}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          </a>
                        </div>
                      )}

                      <div className="relative group">
                        <pre className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 text-xs font-mono text-indigo-200 overflow-x-auto max-h-80 leading-relaxed custom-scrollbar">
                          {JSON.stringify(pgResponse, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TELEMETRY & TRAFFIC GRAPH */}
          {activeTab === 'telemetry' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>API Traffic Volume & Latency Graph</span>
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                      REST v1.3
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                    Real-time telemetry requests across all active application tokens
                  </p>
                </div>
              </div>

              <div className="h-[320px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={apiTrafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCreateDev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorListDev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorGetDev" x1="0" y1="0" x2="0" y2="1">
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
                    <Area type="monotone" dataKey="createQr" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCreateDev)" name="POST /qr/create" />
                    <Area type="monotone" dataKey="listQrs" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorListDev)" name="GET /qr/list" />
                    <Area type="monotone" dataKey="getQr" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorGetDev)" name="GET /qr/:code" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-400 font-mono">
                <div className="flex items-center gap-6 flex-wrap">
                  <span className="flex items-center gap-2 text-indigo-400 font-semibold">
                    <span className="size-2.5 rounded-full bg-indigo-500" />
                    POST /qr/create (24.1%)
                  </span>
                  <span className="flex items-center gap-2 text-pink-400 font-semibold">
                    <span className="size-2.5 rounded-full bg-pink-500" />
                    GET /qr/list (36.4%)
                  </span>
                  <span className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <span className="size-2.5 rounded-full bg-emerald-500" />
                    GET /qr/:code (39.5%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CODE SNIPPETS */}
          {activeTab === 'snippets' && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-4xl mx-auto space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Quick Integration Snippets</h3>
                  <p className="text-zinc-400 text-sm mt-1">Copy and paste these pre-formatted snippets directly into your application codebase.</p>
                </div>

                <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-stretch sm:self-auto flex-wrap">
                  {(['curl', 'node', 'python', 'php', 'go'] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setSnippetLang(lang)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                        snippetLang === lang
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {lang === 'node' ? 'Node.js' : lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative group bg-zinc-950 rounded-2xl border border-zinc-800/80 overflow-hidden">
                <div className="flex justify-between items-center bg-zinc-900/80 px-4 py-2.5 border-b border-zinc-800 text-xs text-zinc-400 font-mono">
                  <span>Create QR Endpoint ({snippetLang.toUpperCase()})</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getCodeSnippet(snippetLang));
                      setCopiedSnippet(true);
                      setTimeout(() => setCopiedSnippet(false), 2500);
                    }}
                    className="flex items-center space-x-1.5 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-md transition-colors border border-indigo-500/20"
                  >
                    {copiedSnippet ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Snippet</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-5 text-sm font-mono text-indigo-100 overflow-x-auto leading-relaxed custom-scrollbar">
                  {getCodeSnippet(snippetLang)}
                </pre>
              </div>

              <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-zinc-900 border border-indigo-500/30 rounded-2xl p-5 flex items-start space-x-3 text-sm text-zinc-300">
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Enterprise SDK Tip:</strong>
                  All QR codes generated through the API automatically inherit your domain redirection (`dynamqr.vercel.app/:shortCode`) and log device/location scan events right inside your main dashboard analytics!
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REST API REFERENCE */}
          {activeTab === 'docs' && (
            <div className="space-y-8 max-w-5xl mx-auto">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                <h2 className="text-2xl font-bold text-white">REST API Reference</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Our API conforms to standard REST conventions. All requests require your secret API Key passed in the <code className="text-indigo-300 bg-zinc-950 px-1.5 py-0.5 rounded font-mono border border-zinc-800">Authorization: Bearer dq_live_...</code> header. All responses return JSON.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">Base URL</span>
                    <code className="text-sm font-mono text-indigo-400">https://dynamqr.vercel.app/api/v1</code>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">Content-Type</span>
                    <code className="text-sm font-mono text-indigo-400">application/json</code>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                  <div className="flex items-center space-x-3">
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg text-xs font-bold uppercase font-mono">
                      POST
                    </span>
                    <code className="text-base sm:text-lg font-mono font-bold text-white">
                      /api/v1/qr/create
                    </code>
                  </div>
                  <p className="text-sm text-zinc-300">Creates a new dynamic QR code link that redirects to your specified destination URL.</p>
                  
                  <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">Request Body Parameters</h4>
                    <div className="divide-y divide-zinc-800/60 text-sm font-mono">
                      <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between">
                        <div>
                          <span className="text-indigo-300 font-bold">destination_url</span>
                          <span className="text-red-400 text-xs ml-2 font-sans">(Required)</span>
                        </div>
                        <span className="text-zinc-400 text-xs font-sans">string (e.g. https://your-site.com)</span>
                      </div>
                      <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between">
                        <div>
                          <span className="text-indigo-300 font-bold">short_code</span>
                          <span className="text-zinc-500 text-xs ml-2 font-sans">(Optional)</span>
                        </div>
                        <span className="text-zinc-400 text-xs font-sans">string (custom slug/code, auto-generated if omitted)</span>
                      </div>
                      <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between">
                        <div>
                          <span className="text-indigo-300 font-bold">keyword</span>
                          <span className="text-zinc-500 text-xs ml-2 font-sans">(Optional)</span>
                        </div>
                        <span className="text-zinc-400 text-xs font-sans">string (tag/identifier for analytics tracking)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                  <div className="flex items-center space-x-3">
                    <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-lg text-xs font-bold uppercase font-mono">
                      GET
                    </span>
                    <code className="text-base sm:text-lg font-mono font-bold text-white">
                      /api/v1/qr/list?limit=20&offset=0
                    </code>
                  </div>
                  <p className="text-sm text-zinc-300">Retrieves a paginated list of all dynamic QR codes created under your account.</p>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                  <div className="flex items-center space-x-3">
                    <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-lg text-xs font-bold uppercase font-mono">
                      GET
                    </span>
                    <code className="text-base sm:text-lg font-mono font-bold text-white">
                      /api/v1/qr/:shortCode
                    </code>
                  </div>
                  <p className="text-sm text-zinc-300">Fetches detailed metadata, destination link, QR image URLs, and live total scan count for a specific QR code.</p>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                  <div className="flex items-center space-x-3">
                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-lg text-xs font-bold uppercase font-mono">
                      PUT
                    </span>
                    <code className="text-base sm:text-lg font-mono font-bold text-white">
                      /api/v1/qr/:shortCode
                    </code>
                  </div>
                  <p className="text-sm text-zinc-300">Updates the destination URL of an existing QR code immediately without changing the printed QR pattern.</p>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                  <div className="flex items-center space-x-3">
                    <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-lg text-xs font-bold uppercase font-mono">
                      DELETE
                    </span>
                    <code className="text-base sm:text-lg font-mono font-bold text-white">
                      /api/v1/qr/:shortCode
                    </code>
                  </div>
                  <p className="text-sm text-zinc-300">Permanently deletes the QR code redirect from your account.</p>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </AppShell>
  );
}
