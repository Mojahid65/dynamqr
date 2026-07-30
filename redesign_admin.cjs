const fs = require('fs');
const path = 'C:/Users/mojah/OneDrive/Desktop/Dynamic qr code maker/src/pages/Admin.tsx';

let content = fs.readFileSync(path, 'utf8');

// Find where the return statement starts (around line 367)
const returnIndex = content.indexOf('return (', content.indexOf('const totalUpdates = updates.length;'));

if (returnIndex === -1) {
    console.error('Could not find return statement');
    process.exit(1);
}

const logicPart = content.substring(0, returnIndex);

const m3RenderPart = `return (
    <div className="min-h-screen bg-background text-foreground font-sans flex overflow-hidden">
      {/* Expressive Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface-variant/20 via-background to-background">
        <div className="absolute top-0 left-1/4 w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-tertiary/10 rounded-full blur-[80px] mix-blend-screen" />
      </div>

      {/* M3 Navigation Drawer (Desktop) */}
      <nav className={\`
        fixed inset-y-0 left-0 z-40 w-72 bg-surface-container shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col border-r border-outline-variant
        \${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      \`}>
        <div className="h-20 flex items-center px-6">
          <div className="flex items-center gap-3 font-bold text-xl text-foreground">
            <div className="bg-primary-container p-2.5 rounded-full text-on-primary-container">
              <ShieldAlert className="w-6 h-6" />
            </div>
            Admin Hub
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="ml-auto md:hidden p-2 text-on-surface-variant hover:bg-surface-variant rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
            { id: 'notifications', icon: History, label: 'Notifications' },
            { id: 'updates', icon: RefreshCw, label: 'Updates' },
            { id: 'qrcodes', icon: QrCode, label: 'QR Codes' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }} 
              className={\`w-full flex items-center gap-4 px-4 py-3.5 rounded-full font-medium transition-all duration-200 \${
                activeTab === item.id 
                  ? 'bg-secondary-container text-on-secondary-container' 
                  : 'text-on-surface hover:bg-surface-variant/50 hover:text-foreground'
              }\`}
            >
              <item.icon className={\`w-5 h-5 \${activeTab === item.id ? 'text-on-secondary-container' : 'text-on-surface-variant'}\`} /> 
              {item.label}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-outline-variant space-y-2">
          <Link to="/dashboard" className="w-full flex items-center gap-4 px-4 py-3 rounded-full text-on-surface font-medium hover:bg-surface-variant/50 transition-colors">
            <Home className="w-5 h-5 text-on-surface-variant" /> App Dashboard
          </Link>
          <button 
            onClick={signOut}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-full text-error font-medium hover:bg-error-container hover:text-on-error-container transition-colors"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto relative z-10 flex flex-col">
        {/* Top App Bar */}
        <header className="h-20 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-outline-variant">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 text-on-surface hover:bg-surface-variant rounded-full" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-foreground capitalize tracking-tight">
              {activeTab}
            </h2>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                type="search"
                placeholder="Search..."
                className="w-64 bg-surface-container-high border-none rounded-full py-2.5 pl-11 pr-4 text-sm text-foreground placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <button className="p-2.5 bg-surface-container hover:bg-surface-variant text-on-surface rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface-container"></span>
            </button>
            <div className="h-10 w-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold shadow-sm">
              {user?.email?.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-1 space-y-8 pb-24">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                  { title: 'Total Users', value: totalUsers, icon: Users, color: 'primary' },
                  { title: 'Push Enabled', value: pushEnabledUsers, icon: Bell, color: 'secondary' },
                  { title: 'Total Updates', value: totalUpdates, icon: UploadCloud, color: 'tertiary' },
                  { title: 'System Status', value: maintenanceMode ? 'Maintenance' : 'Online', icon: Activity, color: maintenanceMode ? 'error' : 'primary' }
                ].map((stat, i) => (
                  <div key={i} className="bg-surface-container rounded-[2rem] p-6 shadow-sm border border-outline-variant hover:bg-surface-container-high transition-colors group">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={\`p-3 rounded-2xl bg-\${stat.color}-container text-on-\${stat.color}-container group-hover:scale-110 transition-transform\`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                    </div>
                    <div>
                      <p className="text-on-surface-variant font-medium text-sm mb-1">{stat.title}</p>
                      <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-surface-container rounded-[2rem] shadow-sm border border-outline-variant overflow-hidden">
                <div className="p-6 md:p-8 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">User Directory</h3>
                    <p className="text-sm text-on-surface-variant mt-1">Manage all registered accounts.</p>
                  </div>
                  <button 
                    onClick={() => setIsNotificationModalOpen(true)}
                    className="flex items-center gap-2 bg-primary text-on-primary hover:bg-primary/90 font-medium py-2.5 px-6 rounded-full shadow-md transition-all text-sm"
                  >
                    <Send className="w-4 h-4" /> 
                    {selectedUsers.length > 0 ? \`Notify \${selectedUsers.length} Users\` : 'Broadcast'}
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-xs text-on-surface-variant uppercase bg-surface-container-low border-b border-outline-variant">
                      <tr>
                        <th className="px-6 py-4 w-12">
                          <button onClick={toggleSelectAll} className="text-on-surface-variant hover:text-primary transition-colors">
                            {selectedUsers.length === profiles.length && profiles.length > 0 ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5" />}
                          </button>
                        </th>
                        <th className="px-6 py-4 font-semibold">User</th>
                        <th className="px-6 py-4 font-semibold">Device Info</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/50">
                      {profiles.length === 0 && !loading && (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">No users found.</td></tr>
                      )}
                      {profiles.map(p => (
                        <tr key={p.id} className={\`hover:bg-surface-container-high transition-colors \${selectedUsers.includes(p.id) ? 'bg-primary/5' : ''}\`}>
                          <td className="px-6 py-4">
                            <button onClick={() => toggleSelectUser(p.id)} className="text-on-surface-variant hover:text-primary transition-colors">
                              {selectedUsers.includes(p.id) ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5" />}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
                                {p.email.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-foreground">{p.email}</div>
                                <div className="text-xs text-on-surface-variant">{new Date(p.created_at).toLocaleDateString()}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-on-surface-variant">
                              <SmartphoneNfc className="w-4 h-4" />
                              {p.device_name || 'Unknown'} {p.android_version ? \`(A\${p.android_version})\` : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {p.push_token ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary-container text-on-secondary-container">
                                Enabled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-surface-variant text-on-surface-variant">
                                Disabled
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => toggleBan(p.id, p.is_banned)}
                              className={\`px-4 py-2 rounded-full text-xs font-bold transition-colors \${p.is_banned ? 'bg-surface-variant text-on-surface hover:bg-surface-container-highest' : 'bg-error-container text-on-error-container hover:bg-error/90 hover:text-on-error'}\`}
                            >
                              {p.is_banned ? 'Unban User' : 'Ban User'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-surface-container rounded-[2rem] shadow-sm border border-outline-variant p-6 md:p-8">
                  <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant pb-6">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Notification History</h3>
                      <p className="text-sm text-on-surface-variant mt-1">Review previously sent push broadcasts.</p>
                    </div>
                    <button 
                      onClick={() => setIsNotificationModalOpen(true)}
                      className="flex items-center gap-2 bg-primary text-on-primary hover:bg-primary/90 font-medium py-2.5 px-6 rounded-full shadow-md transition-all"
                    >
                      <Send className="w-4 h-4" /> Send New
                    </button>
                  </div>

                  <div className="space-y-4">
                    {notificationHistory.length === 0 ? (
                      <div className="text-center py-10 text-on-surface-variant">No notifications sent yet.</div>
                    ) : (
                      notificationHistory.map((item) => (
                        <div key={item.id} className="p-6 rounded-[2rem] bg-surface-container-low border border-outline-variant flex flex-col md:flex-row gap-6">
                          {item.image_url && (
                            <div className="h-24 w-24 rounded-[1.5rem] overflow-hidden flex-shrink-0 border border-outline-variant">
                              <img src={item.image_url} alt="Notification" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-lg font-bold text-foreground">{item.title}</h4>
                              <span className="text-xs font-medium text-on-surface-variant bg-surface-variant/50 px-3 py-1 rounded-full">{new Date(item.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-on-surface-variant mb-4">{item.body}</p>
                            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                              Targets: {item.target_users.length > 5 ? \`\${item.target_users.length} users\` : item.target_users.join(', ')}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
               </div>
             </div>
          )}

          {/* UPDATES TAB */}
          {activeTab === 'updates' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Deploy Update Form */}
              <div className="bg-surface-container rounded-[2rem] shadow-sm border border-outline-variant p-6 md:p-8 h-fit">
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-foreground">Deploy Update</h3>
                  <p className="text-sm text-on-surface-variant mt-1">Push a new OTA version to mobile clients.</p>
                </div>
                
                <form onSubmit={handlePublishUpdate} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-on-surface">Version Code</label>
                      <input
                        type="number"
                        required
                        value={versionCode}
                        onChange={(e) => setVersionCode(e.target.value)}
                        placeholder="e.g. 5"
                        className="w-full rounded-full bg-surface-container-highest border-none px-5 py-3.5 text-sm text-foreground placeholder-on-surface-variant focus:ring-2 focus:ring-primary transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-on-surface">Version Name</label>
                      <input
                        type="text"
                        required
                        value={versionName}
                        onChange={(e) => setVersionName(e.target.value)}
                        placeholder="e.g. 1.2.0"
                        className="w-full rounded-full bg-surface-container-highest border-none px-5 py-3.5 text-sm text-foreground placeholder-on-surface-variant focus:ring-2 focus:ring-primary transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-on-surface">Update URL (.apk file)</label>
                    <input
                      type="url"
                      required
                      value={updateUrl}
                      onChange={(e) => setUpdateUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-full bg-surface-container-highest border-none px-5 py-3.5 text-sm text-foreground placeholder-on-surface-variant focus:ring-2 focus:ring-primary transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-on-surface">Release Notes</label>
                    <textarea
                      required
                      value={releaseNotes}
                      onChange={(e) => setReleaseNotes(e.target.value)}
                      placeholder="- New features added...&#10;- Bug fixes..."
                      rows={4}
                      className="w-full rounded-[1.5rem] bg-surface-container-highest border-none px-5 py-4 text-sm text-foreground placeholder-on-surface-variant focus:ring-2 focus:ring-primary transition-all outline-none resize-none"
                    />
                  </div>

                  <label className="flex items-center gap-4 p-4 rounded-[1.5rem] border border-outline-variant bg-surface-container-low cursor-pointer hover:bg-surface-variant/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={isMandatory}
                      onChange={(e) => setIsMandatory(e.target.checked)}
                      className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-sm font-bold text-foreground">Mandatory Update</p>
                      <p className="text-xs text-on-surface-variant">Force users to install this update.</p>
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary hover:bg-primary/90 font-bold py-4 px-4 rounded-full shadow-md transition-all disabled:opacity-50 mt-4"
                  >
                    {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                    Publish Release
                  </button>
                </form>
              </div>

              {/* Release History */}
              <div className="bg-surface-container rounded-[2rem] shadow-sm border border-outline-variant flex flex-col h-fit md:max-h-[800px]">
                <div className="p-6 md:p-8 border-b border-outline-variant">
                  <h3 className="text-xl font-bold text-foreground">Release History</h3>
                  <p className="text-sm text-on-surface-variant mt-1">Previously published versions.</p>
                </div>
                <div className="p-6 md:p-8 overflow-y-auto space-y-4">
                  {updates.length === 0 ? (
                    <div className="text-center py-10 text-on-surface-variant">No updates published yet.</div>
                  ) : (
                    updates.map((update) => (
                      <div key={update.id} className="p-6 rounded-[2rem] bg-surface-container-low border border-outline-variant">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-foreground">v{update.version_name}</span>
                            <span className="px-3 py-1 bg-surface-variant text-on-surface-variant text-xs font-bold rounded-full">Build {update.version_code}</span>
                          </div>
                          {update.is_mandatory ? (
                            <span className="px-3 py-1 bg-error-container text-on-error-container text-xs font-bold rounded-full flex items-center gap-1.5 uppercase">
                              <AlertTriangle className="w-3.5 h-3.5" /> Mandatory
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-surface-variant text-on-surface-variant text-xs font-bold rounded-full flex items-center gap-1.5 uppercase">
                              <Check className="w-3.5 h-3.5" /> Optional
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-on-surface-variant bg-surface-container-highest p-4 rounded-[1.5rem] mb-4 whitespace-pre-wrap font-mono leading-relaxed">
                          {update.release_notes}
                        </div>
                        <div className="flex justify-between items-center">
                          <a href={update.update_url} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline text-sm flex items-center gap-1">
                            Download APK
                          </a>
                          <span className="text-xs font-medium text-on-surface-variant">{new Date(update.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* QR CODES TAB */}
          {activeTab === 'qrcodes' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-surface-container rounded-[2rem] shadow-sm border border-outline-variant overflow-hidden">
                <div className="p-6 md:p-8 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">All QR Codes</h3>
                    <p className="text-sm text-on-surface-variant mt-1">View and manage all user-generated QR codes.</p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                    <input
                      type="text"
                      placeholder="Search ID, shortcode, URL..."
                      value={qrSearchQuery}
                      onChange={(e) => setQrSearchQuery(e.target.value)}
                      className="w-full rounded-full bg-surface-container-highest border-none pl-11 pr-4 py-2.5 text-sm text-foreground placeholder-on-surface-variant focus:ring-2 focus:ring-primary transition-all outline-none"
                    />
                  </div>
                </div>
                
                <div className="overflow-x-auto p-4 md:p-6 space-y-3">
                  {(() => {
                    const filteredQrs = qrCodes.filter(q => {
                      const userEmail = profiles.find(p => p.id === q.user_id)?.email || '';
                      const qStr = qrSearchQuery.toLowerCase();
                      return q.id.toLowerCase().includes(qStr) || 
                             userEmail.toLowerCase().includes(qStr) || 
                             q.short_code.toLowerCase().includes(qStr) || 
                             q.destination_url.toLowerCase().includes(qStr);
                    });
                    
                    if (filteredQrs.length === 0) {
                      return <div className="p-12 text-center text-on-surface-variant">No QR codes found.</div>;
                    }

                    return filteredQrs.map(qr => {
                      const userEmail = profiles.find(p => p.id === qr.user_id)?.email || 'Unknown';
                      return (
                        <div key={qr.id} className="bg-surface-container-low border border-outline-variant rounded-[1.5rem] p-4 flex flex-col md:flex-row items-start md:items-center gap-4 hover:bg-surface-container-high transition-colors">
                          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                            <div>
                              <p className="text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Owner</p>
                              <div className="font-medium text-foreground truncate">{userEmail}</div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Shortcode</p>
                              <div className="font-bold text-primary bg-primary/10 inline-block px-2.5 py-1 rounded-lg">/{qr.short_code}</div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Destination</p>
                              <a href={qr.destination_url} target="_blank" rel="noreferrer" className="text-foreground hover:text-primary truncate block transition-colors">
                                {qr.destination_url}
                              </a>
                            </div>
                          </div>
                          <div className="flex-shrink-0 w-full md:w-auto text-right md:text-left mt-2 md:mt-0">
                            <button 
                              onClick={() => { setEditingQr(qr); setEditUrl(qr.destination_url); }}
                              className="w-full md:w-auto px-5 py-2.5 rounded-full bg-secondary-container text-on-secondary-container hover:bg-secondary/90 font-bold text-sm transition-colors flex items-center justify-center gap-2"
                            >
                              <Edit className="w-4 h-4" /> Edit
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-surface-container rounded-[2rem] shadow-sm border border-outline-variant p-6 md:p-8">
                <div className="mb-8 border-b border-outline-variant pb-6">
                  <h3 className="text-xl font-bold text-foreground">App Configuration</h3>
                  <p className="text-sm text-on-surface-variant mt-1">Manage global app settings and maintenance.</p>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-[1.5rem] border border-error/30 bg-error-container/20">
                    <div className="mb-4 sm:mb-0">
                      <h4 className="text-lg font-bold text-foreground">Maintenance Mode</h4>
                      <p className="text-sm text-on-surface-variant mt-1 max-w-sm">Block all users from accessing the app. Use only during critical updates.</p>
                    </div>
                    <button 
                      onClick={toggleMaintenanceMode}
                      className={\`relative w-16 h-8 rounded-full transition-colors flex items-center p-1 focus:outline-none \${maintenanceMode ? 'bg-error' : 'bg-surface-variant'}\`}
                    >
                      <span className={\`w-6 h-6 bg-surface-container-lowest rounded-full shadow-md transform transition-transform duration-300 \${maintenanceMode ? 'translate-x-8' : 'translate-x-0'}\`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* NOTIFICATION MODAL */}
      {isNotificationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsNotificationModalOpen(false)}></div>
          <div className="bg-surface-container rounded-[2rem] shadow-2xl border border-outline-variant w-full max-w-4xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-200 flex flex-col md:flex-row">
            
            <div className="flex-1 flex flex-col border-r border-outline-variant">
              <div className="p-6 border-b border-outline-variant bg-surface-container-high">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" /> 
                  Compose Notification
                </h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  {selectedUsers.length > 0 
                    ? \`Targeting \${selectedUsers.length} selected user(s)\` 
                    : 'Broadcasting to all registered users'}
                </p>
              </div>
              
              <form onSubmit={handleSendNotification} className="p-6 space-y-6 bg-surface-container-lowest flex-1 overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Notification Title</label>
                  <input
                    type="text"
                    required
                    value={previewTitle}
                    onChange={(e) => setPreviewTitle(e.target.value)}
                    placeholder="e.g. Special Offer Inside!"
                    className="w-full rounded-full bg-surface-container border-none px-5 py-3.5 text-sm text-foreground placeholder-on-surface-variant focus:ring-2 focus:ring-primary transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Message Content</label>
                  <textarea
                    required
                    value={previewBody}
                    onChange={(e) => setPreviewBody(e.target.value)}
                    placeholder="Type your message here..."
                    rows={4}
                    className="w-full rounded-[1.5rem] bg-surface-container border-none px-5 py-4 text-sm text-foreground placeholder-on-surface-variant focus:ring-2 focus:ring-primary transition-all outline-none resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-on-surface flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-on-surface-variant" /> Image <span className="text-on-surface-variant font-normal">(Optional)</span>
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-outline-variant border-dashed rounded-[1.5rem] cursor-pointer bg-surface-container hover:bg-surface-container-high transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud className="w-8 h-8 mb-2 text-on-surface-variant" />
                      <p className="mb-1 text-sm text-on-surface-variant"><span className="font-bold text-primary">Click to upload</span></p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                  {selectedImageFile && (
                    <div className="flex items-center justify-between p-3 bg-surface-container-high rounded-xl border border-outline-variant">
                      <span className="text-sm text-on-surface font-medium truncate">{selectedImageFile.name}</span>
                      <button type="button" onClick={() => { setSelectedImageFile(null); setPreviewImage(null); }} className="p-2 bg-error-container text-on-error-container rounded-full">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsNotificationModalOpen(false)}
                    className="flex-1 py-3.5 px-4 rounded-full border border-outline-variant text-foreground font-bold hover:bg-surface-variant transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] py-3.5 px-4 rounded-full bg-primary hover:bg-primary/90 text-on-primary font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    Send Now
                  </button>
                </div>
              </form>
            </div>

            <div className="w-full md:w-[380px] bg-surface-container-high p-8 flex flex-col items-center justify-center relative">
              <button onClick={() => setIsNotificationModalOpen(false)} className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-foreground bg-surface-variant/50 rounded-full">
                <CloseIcon className="w-5 h-5" />
              </button>
              
              <h4 className="text-xs font-bold text-on-surface-variant mb-6 uppercase tracking-widest">Preview</h4>
              
              <div className="w-[300px] h-[600px] bg-surface-container-lowest rounded-[2.5rem] border-[6px] border-surface-variant p-4 relative shadow-2xl flex flex-col overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-surface-variant rounded-b-2xl"></div>
                
                <div className="flex-1 w-full bg-background rounded-[1.5rem] mt-4 relative">
                  {(previewTitle || previewBody || previewImage) ? (
                    <div className="absolute top-4 left-2 right-2 bg-surface-container-highest rounded-[1.5rem] overflow-hidden shadow-lg border border-outline-variant/30 animate-in slide-in-from-top-4">
                      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-outline-variant/50">
                        <div className="w-4 h-4 bg-primary rounded-sm"></div>
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase">DynamQR • now</span>
                      </div>
                      {previewImage && (
                        <div className="w-full h-32 bg-surface-variant">
                          <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-4">
                        <h5 className="text-sm font-bold text-foreground mb-1">{previewTitle || 'Title'}</h5>
                        <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">{previewBody || 'Message...'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-on-surface-variant font-medium text-center px-8">
                      Start typing to preview
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT QR URL MODAL */}
      {editingQr && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingQr(null)}></div>
          <div className="bg-surface-container rounded-[2rem] border border-outline-variant shadow-2xl w-full max-w-md relative z-10 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant bg-surface-container-high rounded-t-[2rem] flex justify-between items-center">
              <h3 className="text-xl font-bold text-foreground">Edit Destination</h3>
              <button onClick={() => setEditingQr(null)} className="p-2 bg-surface-variant hover:bg-surface-variant/80 rounded-full text-on-surface-variant">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateQrUrl} className="p-6 space-y-6 bg-surface-container-lowest rounded-b-[2rem]">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">New URL</label>
                <input
                  type="url"
                  required
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="w-full rounded-full bg-surface-container-highest border-none px-5 py-4 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setEditingQr(null)}
                  className="flex-1 py-3.5 rounded-full border border-outline-variant font-bold hover:bg-surface-variant transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 rounded-full bg-primary text-on-primary font-bold flex justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
`;

// Replace the return block
const newContent = logicPart + m3RenderPart;

fs.writeFileSync(path, newContent, 'utf8');
console.log('Redesign complete!');
