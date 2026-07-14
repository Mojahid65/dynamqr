import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { 
  Code2, Key, Terminal, BookOpen, Copy, Check, Plus, Trash2, 
  Play, ArrowLeft, ExternalLink, RefreshCw, Sparkles, 
  Lock, CheckCircle2, Clock, QrCode, LogOut, Cpu
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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

export default function DeveloperPortal() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'keys' | 'playground' | 'snippets' | 'docs'>('keys');
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
    if (!selectedKeyId && !createdRawKey) {
      alert('Please select or create an active API key first');
      return;
    }
    setPgLoading(true);
    setPgResponse(null);
    const startTime = performance.now();

    try {
      // For the playground, if we don't have the raw key (because it's hashed in DB), we call the local RPC directly or ask user for raw key if testing external. But if we just created a key or if we call via user auth session or verify endpoint, let's call our /api/v1/qr/create endpoint with whatever raw key they just created OR call our secure RPC via user session as a live test!
      let testKey = createdRawKey || '';
      if (!testKey) {
        // Prompt developer or use demo simulation if they don't have the raw key stored right now
        const userInput = prompt('Enter your raw API key (starts with dq_live_...) to test the live endpoint:', '');
        if (!userInput || !userInput.startsWith('dq_live_')) {
          setPgLoading(false);
          setPgResponse({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Live playground requires passing the raw API Key (dq_live_...) created from the Keys tab.'
            }
          });
          return;
        }
        testKey = userInput.trim();
      }

      const res = await fetch('/api/v1/qr/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          destination_url: pgUrl,
          short_code: pgShortCode || undefined
        })
      });

      const endTime = performance.now();
      setPgTime(Math.round(endTime - startTime));

      const data = await res.json();
      setPgResponse({ status: res.status, ...data });
      if (res.ok) {
        fetchKeys(); // update last_used_at
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
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer ${sampleKey}",
    "Content-Type: application/json"
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "destination_url" => "https://your-app.com/orders/9921",
    "short_code" => "order9921"
  ])
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
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Top Navbar */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <Link to="/" className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-purple-300">
                  DynamQR Developer Portal
                </span>
                <span className="ml-2 text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30 font-mono">
                  v1.0 API
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center space-x-2"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <span className="text-sm text-slate-400 hidden md:block border-l border-slate-800 pl-4 font-mono">{user?.email}</span>
              <button 
                onClick={signOut}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero / Banner Header */}
      <div className="bg-gradient-to-b from-slate-900 via-indigo-950/20 to-slate-900 border-b border-slate-800 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              Build with Dynamic QRs
            </h1>
            <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
              Generate, manage, and track dynamic QR codes programmatically via our enterprise REST API. Integrate into your billing systems, SaaS workflows, POS apps, and marketing pipelines in minutes.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-slate-400 text-xs uppercase tracking-wider mb-1 font-semibold">
                <Key className="w-4 h-4 text-indigo-400" />
                <span>Active Keys</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {apiKeys.filter(k => k.status === 'active').length}
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-slate-400 text-xs uppercase tracking-wider mb-1 font-semibold">
                <Cpu className="w-4 h-4 text-green-400" />
                <span>API Status</span>
              </div>
              <div className="text-lg font-bold text-green-400 flex items-center space-x-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span>Operational</span>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-slate-400 text-xs uppercase tracking-wider mb-1 font-semibold">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Rate Limit</span>
              </div>
              <div className="text-lg font-bold text-white mt-1">
                60 <span className="text-xs text-slate-400 font-normal">req / min</span>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-2 text-slate-400 text-xs uppercase tracking-wider mb-1 font-semibold">
                <Lock className="w-4 h-4 text-pink-400" />
                <span>Protocol</span>
              </div>
              <div className="text-lg font-bold text-white mt-1 font-mono text-sm">
                Bearer Token
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-slate-800 bg-slate-900/95 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 overflow-x-auto py-2">
            <button
              onClick={() => setActiveTab('keys')}
              className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === 'keys'
                  ? 'border-indigo-500 text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>API Keys ({apiKeys.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('playground')}
              className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === 'playground'
                  ? 'border-indigo-500 text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>Interactive Playground</span>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono">Live</span>
            </button>

            <button
              onClick={() => setActiveTab('snippets')}
              className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === 'snippets'
                  ? 'border-indigo-500 text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Code Examples</span>
            </button>

            <button
              onClick={() => setActiveTab('docs')}
              className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === 'docs'
                  ? 'border-indigo-500 text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>API Reference</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TAB 1: API KEYS MANAGEMENT */}
        {activeTab === 'keys' && (
          !user ? (
            <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Developer Authentication Required</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
                  Please sign in or create a free account to generate, copy, and manage secure REST API keys for your applications.
                </p>
              </div>
              <div className="flex justify-center space-x-4 pt-2">
                <Link to="/login" className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-medium transition-all text-sm border border-slate-700">
                  Sign In
                </Link>
                <Link to="/register" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/30 text-sm">
                  Create Account
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Newly Created Key Alert / Modal Box */}
              {createdRawKey && (
                <div className="bg-gradient-to-r from-green-950/80 via-indigo-950/80 to-slate-900 border-2 border-green-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Your API Key Generated Successfully!</h3>
                        <p className="text-slate-300 text-sm mt-0.5">
                          Please copy your secret key right now. For security reasons, <span className="text-amber-400 font-semibold underline">it will never be shown again</span> once you leave or refresh.
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setCreatedRawKey(null)}
                      className="text-slate-400 hover:text-white text-sm font-medium bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Done
                    </button>
                  </div>

                  <div className="mt-6 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-sm">
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
                          <Check className="w-4 h-4 text-green-300" />
                          <span className="text-green-200">Copied to Clipboard!</span>
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
                  <h2 className="text-xl font-bold text-white">Your API Keys</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Manage the API tokens that authenticate your applications and microservices with DynamQR.
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center space-x-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create New API Key</span>
                </button>
              </div>

              {/* Create Key Modal */}
              {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="bg-indigo-500/20 p-2.5 rounded-2xl text-indigo-400 border border-indigo-500/30">
                          <Key className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">Create API Key</h3>
                          <p className="text-xs text-slate-400">Generate a unique key for your project</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowModal(false)}
                        className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={(e) => { handleCreateKey(e); setShowModal(false); }} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">Key Name</label>
                        <input
                          type="text"
                          required
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          placeholder="e.g., Production Web App, POS Terminal, Zapier"
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-white placeholder-slate-600 transition-all text-sm"
                        />
                        <p className="text-xs text-slate-500">A human-readable label to help you identify where this key is used.</p>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-300">Key Permissions</label>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
                            <input
                              type="checkbox"
                              checked={permissions.create_qr}
                              onChange={(e) => setPermissions({ ...permissions, create_qr: e.target.checked })}
                              className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 w-4 h-4"
                            />
                            <span className="text-sm text-slate-300 font-medium">Create QR Codes</span>
                          </label>

                          <label className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
                            <input
                              type="checkbox"
                              checked={permissions.read_qr}
                              onChange={(e) => setPermissions({ ...permissions, read_qr: e.target.checked })}
                              className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 w-4 h-4"
                            />
                            <span className="text-sm text-slate-300 font-medium">Read & List QRs</span>
                          </label>

                          <label className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
                            <input
                              type="checkbox"
                              checked={permissions.update_qr}
                              onChange={(e) => setPermissions({ ...permissions, update_qr: e.target.checked })}
                              className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 w-4 h-4"
                            />
                            <span className="text-sm text-slate-300 font-medium">Update Destination</span>
                          </label>

                          <label className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
                            <input
                              type="checkbox"
                              checked={permissions.delete_qr}
                              onChange={(e) => setPermissions({ ...permissions, delete_qr: e.target.checked })}
                              className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 w-4 h-4"
                            />
                            <span className="text-sm text-slate-300 font-medium">Delete QRs</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex space-x-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowModal(false)}
                          className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={creatingKey || !newKeyName.trim()}
                          className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/30 text-sm flex items-center justify-center space-x-2"
                        >
                          {creatingKey ? <span>Generating...</span> : <span>Generate Key</span>}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Keys Table / List */}
              {loadingKeys ? (
                <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-8 animate-pulse space-y-4">
                  <div className="h-6 bg-slate-800 rounded w-1/4"></div>
                  <div className="h-12 bg-slate-800/60 rounded-xl"></div>
                  <div className="h-12 bg-slate-800/60 rounded-xl"></div>
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="bg-slate-800/30 border border-slate-800 border-dashed rounded-3xl p-12 text-center max-w-2xl mx-auto">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 text-indigo-400">
                    <Key className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No API keys created yet</h3>
                  <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                    Create an API key to unlock programmatic dynamic QR code generation from your external servers or scripts.
                  </p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium inline-flex items-center space-x-2 transition-all shadow-lg shadow-indigo-600/20"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Your First Key</span>
                  </button>
                </div>
              ) : (
                <div className="bg-slate-800/40 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider">
                          <th className="py-4 px-6 font-semibold">Key Name</th>
                          <th className="py-4 px-6 font-semibold">Token Prefix</th>
                          <th className="py-4 px-6 font-semibold">Status</th>
                          <th className="py-4 px-6 font-semibold">Created</th>
                          <th className="py-4 px-6 font-semibold">Last Used</th>
                          <th className="py-4 px-6 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-sm">
                        {apiKeys.map((key) => (
                          <tr key={key.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-4 px-6 font-semibold text-white">
                              <div className="flex items-center space-x-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                <span>{key.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 font-mono text-xs text-indigo-300">
                              {key.key_prefix}••••••••••••••••
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                key.status === 'active'
                                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                  key.status === 'active' ? 'bg-green-400' : 'bg-red-400'
                                }`}></span>
                                {key.status === 'active' ? 'Active' : 'Revoked'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-400 text-xs">
                              {new Date(key.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6 text-slate-400 text-xs">
                              {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Never'}
                            </td>
                            <td className="py-4 px-6 text-right space-x-3">
                              <button
                                onClick={() => handleRevokeKey(key.id, key.status)}
                                className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                              >
                                {key.status === 'active' ? 'Revoke' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleDeleteKey(key.id)}
                                className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors inline-block align-middle"
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
            <div className="lg:col-span-7 bg-slate-800/40 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <div className="bg-indigo-500/20 p-2 rounded-xl text-indigo-400">
                  <Play className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Live API Request Builder</h3>
                  <p className="text-xs text-slate-400">Test creating dynamic QR codes in real-time</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">
                    1. Authentication Key
                  </label>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm flex items-center justify-between">
                    <span className="text-slate-300 font-mono">
                      {createdRawKey ? `${createdRawKey}` : `Bearer dq_live_•••••••••••• (Test Key / Prompt on Click)`}
                    </span>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">
                      POST /api/v1/qr/create
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">
                    {createdRawKey ? "Using your recently generated raw API key above for live test." : "When you click Send below, if no raw key is cached, you can enter your secret key."}
                  </p>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">
                    2. Destination URL (Required)
                  </label>
                  <input
                    type="text"
                    value={pgUrl}
                    onChange={(e) => setPgUrl(e.target.value)}
                    placeholder="https://yourwebsite.com/product/123"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                  <p className="text-xs text-slate-500 mt-1">The destination link where the QR code will redirect users upon scanning.</p>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">
                    3. Custom Short Code / Keyword (Optional)
                  </label>
                  <input
                    type="text"
                    value={pgShortCode}
                    onChange={(e) => setPgShortCode(e.target.value)}
                    placeholder="e.g. promo2026 (leave blank for auto-generation)"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleTestPlayground}
                    disabled={pgLoading || !pgUrl}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-indigo-600/30 active:scale-98"
                  >
                    {pgLoading ? (
                      <span className="flex items-center space-x-2">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Sending Request to API...</span>
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
              <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-base font-bold text-white">Live API Response</h3>
                  </div>
                  {pgResponse && (
                    <div className="flex items-center space-x-2 text-xs font-mono">
                      <span className={`px-2 py-0.5 rounded-md font-semibold ${
                        pgResponse.status >= 200 && pgResponse.status < 300
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {pgResponse.status || (pgResponse.success ? '201 Created' : '400 Error')}
                      </span>
                      {pgTime && <span className="text-slate-400">{pgTime}ms</span>}
                    </div>
                  )}
                </div>

                {!pgResponse && !pgLoading && (
                  <div className="py-12 text-center text-slate-500 text-sm">
                    <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                    <p>Click "Send Live API Request" to execute and inspect real-time JSON response and QR code rendering.</p>
                  </div>
                )}

                {pgLoading && (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto"></div>
                    <p className="text-sm text-slate-400">Executing serverless endpoint...</p>
                  </div>
                )}

                {pgResponse && (
                  <div className="space-y-6">
                    {/* Visual QR Preview if success */}
                    {pgResponse.success && pgResponse.data && (
                      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-3">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Live Rendered Dynamic QR
                        </span>
                        <div className="bg-white p-3 rounded-xl shadow-lg">
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

                    {/* JSON Code View */}
                    <div className="relative group">
                      <pre className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 text-xs font-mono text-indigo-200 overflow-x-auto max-h-80 leading-relaxed">
                        {JSON.stringify(pgResponse, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CODE SNIPPETS */}
        {activeTab === 'snippets' && (
          <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Quick Integration Snippets</h3>
                <p className="text-slate-400 text-sm mt-1">Copy and paste these pre-formatted snippets directly into your application codebase.</p>
              </div>

              {/* Language Selector */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-stretch sm:self-auto">
                {(['curl', 'node', 'python', 'php', 'go'] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setSnippetLang(lang)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                      snippetLang === lang
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang === 'node' ? 'Node.js' : lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative group bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden">
              <div className="flex justify-between items-center bg-slate-900/80 px-4 py-2.5 border-b border-slate-800 text-xs text-slate-400 font-mono">
                <span>Create QR Endpoint ({snippetLang.toUpperCase()})</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getCodeSnippet(snippetLang));
                    setCopiedSnippet(true);
                    setTimeout(() => setCopiedSnippet(false), 2500);
                  }}
                  className="flex items-center space-x-1.5 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-md transition-colors"
                >
                  {copiedSnippet ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-5 text-sm font-mono text-indigo-100 overflow-x-auto leading-relaxed">
                {getCodeSnippet(snippetLang)}
              </pre>
            </div>

            <div className="bg-gradient-to-r from-indigo-950/40 to-purple-950/40 border border-indigo-500/20 rounded-2xl p-5 flex items-start space-x-3 text-sm text-slate-300">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">Enterprise SDK Tip:</strong>
                All QR codes generated through the API automatically inherit your domain redirection (`dynamqr.vercel.app/:shortCode`) and log device/location scan events right inside your main dashboard analytics!
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: API REFERENCE & DOCS */}
        {activeTab === 'docs' && (
          <div className="space-y-8 max-w-5xl mx-auto">
            <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <h2 className="text-2xl font-bold text-white">REST API Reference</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Our API conforms to standard REST conventions. All requests require your secret API Key passed in the <code className="text-indigo-300 bg-slate-900 px-1.5 py-0.5 rounded font-mono">Authorization: Bearer dq_live_...</code> header. All responses return JSON.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Base URL</span>
                  <code className="text-sm font-mono text-indigo-400">https://dynamqr.vercel.app/api/v1</code>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Content-Type</span>
                  <code className="text-sm font-mono text-indigo-400">application/json</code>
                </div>
              </div>
            </div>

            {/* Endpoints Breakdown */}
            <div className="space-y-6">
              
              {/* Endpoint 1: POST /api/v1/qr/create */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-lg text-xs font-bold uppercase font-mono">
                    POST
                  </span>
                  <code className="text-base sm:text-lg font-mono font-bold text-white">
                    /api/v1/qr/create
                  </code>
                </div>
                <p className="text-sm text-slate-300">Creates a new dynamic QR code link that redirects to your specified destination URL.</p>
                
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Request Body Parameters</h4>
                  <div className="divide-y divide-slate-800/60 text-sm font-mono">
                    <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between">
                      <div>
                        <span className="text-indigo-300 font-bold">destination_url</span>
                        <span className="text-red-400 text-xs ml-2 font-sans">(Required)</span>
                      </div>
                      <span className="text-slate-400 text-xs font-sans">string (e.g. https://your-site.com)</span>
                    </div>
                    <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between">
                      <div>
                        <span className="text-indigo-300 font-bold">short_code</span>
                        <span className="text-slate-500 text-xs ml-2 font-sans">(Optional)</span>
                      </div>
                      <span className="text-slate-400 text-xs font-sans">string (custom slug/code, auto-generated if omitted)</span>
                    </div>
                    <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between">
                      <div>
                        <span className="text-indigo-300 font-bold">keyword</span>
                        <span className="text-slate-500 text-xs ml-2 font-sans">(Optional)</span>
                      </div>
                      <span className="text-slate-400 text-xs font-sans">string (tag/identifier for analytics tracking)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Endpoint 2: GET /api/v1/qr/list */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-lg text-xs font-bold uppercase font-mono">
                    GET
                  </span>
                  <code className="text-base sm:text-lg font-mono font-bold text-white">
                    /api/v1/qr/list?limit=20&offset=0
                  </code>
                </div>
                <p className="text-sm text-slate-300">Retrieves a paginated list of all dynamic QR codes created under your account.</p>
              </div>

              {/* Endpoint 3: GET /api/v1/qr/:shortCode */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-lg text-xs font-bold uppercase font-mono">
                    GET
                  </span>
                  <code className="text-base sm:text-lg font-mono font-bold text-white">
                    /api/v1/qr/:shortCode
                  </code>
                </div>
                <p className="text-sm text-slate-300">Fetches detailed metadata, destination link, QR image URLs, and live total scan count for a specific QR code.</p>
              </div>

              {/* Endpoint 4: PUT /api/v1/qr/:shortCode */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-lg text-xs font-bold uppercase font-mono">
                    PUT
                  </span>
                  <code className="text-base sm:text-lg font-mono font-bold text-white">
                    /api/v1/qr/:shortCode
                  </code>
                </div>
                <p className="text-sm text-slate-300">Updates the destination URL of an existing QR code immediately without changing the printed QR pattern.</p>
              </div>

              {/* Endpoint 5: DELETE /api/v1/qr/:shortCode */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-lg text-xs font-bold uppercase font-mono">
                    DELETE
                  </span>
                  <code className="text-base sm:text-lg font-mono font-bold text-white">
                    /api/v1/qr/:shortCode
                  </code>
                </div>
                <p className="text-sm text-slate-300">Permanently deletes the QR code redirect from your account.</p>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
