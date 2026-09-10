const fs = require('fs');
const path = 'C:/Users/mojah/OneDrive/Desktop/Dynamic qr code maker/src/pages/Admin.tsx';

let content = fs.readFileSync(path, 'utf8');

// Inject state
content = content.replace(
  "const [previewTitle, setPreviewTitle] = useState('');",
  "const [previewTitle, setPreviewTitle] = useState('');\n  const [modalUserSearch, setModalUserSearch] = useState('');"
);

// Inject UI
const searchUI = `<div className="space-y-3">
                  <label className="text-sm font-semibold text-on-surface">Target Specific Users (Optional)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedUsers.length === 0 && <span className="text-xs text-on-surface-variant bg-surface-variant/30 px-3 py-1.5 rounded-full">Broadcasting to all</span>}
                    {selectedUsers.map(id => {
                      const p = profiles.find(x => x.id === id);
                      return (
                        <span key={id} className="text-xs font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20 flex items-center gap-1.5">
                          {p?.email || 'Unknown'}
                          <button type="button" onClick={() => toggleSelectUser(id)} className="hover:text-primary/70"><X className="w-3 h-3" /></button>
                        </span>
                      );
                    })}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                    <input
                      type="text"
                      value={modalUserSearch}
                      onChange={(e) => setModalUserSearch(e.target.value)}
                      placeholder="Search email to target..."
                      className="w-full rounded-full bg-surface-container border-none pl-11 pr-4 py-3 text-sm text-foreground placeholder-on-surface-variant focus:ring-2 focus:ring-primary transition-all outline-none"
                    />
                    {modalUserSearch && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-high border border-outline-variant rounded-[1.5rem] shadow-xl overflow-hidden z-20 max-h-48 overflow-y-auto">
                        {profiles.filter(p => p.email.toLowerCase().includes(modalUserSearch.toLowerCase()) && !selectedUsers.includes(p.id)).length === 0 ? (
                          <div className="p-4 text-sm text-on-surface-variant text-center">No users found.</div>
                        ) : (
                          profiles.filter(p => p.email.toLowerCase().includes(modalUserSearch.toLowerCase()) && !selectedUsers.includes(p.id)).slice(0, 5).map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => { toggleSelectUser(p.id); setModalUserSearch(''); }}
                              className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-surface-variant/50 transition-colors flex items-center justify-between"
                            >
                              <span>{p.email}</span>
                              {!p.push_token && <span className="text-[10px] font-bold bg-error-container text-on-error-container px-2 py-0.5 rounded uppercase">No Push</span>}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">`;

content = content.replace(
  `<form onSubmit={handleSendNotification} className="p-6 space-y-6 bg-surface-container-lowest flex-1 overflow-y-auto">\n                <div className="space-y-2">`,
  `<form onSubmit={handleSendNotification} className="p-6 space-y-6 bg-surface-container-lowest flex-1 overflow-y-auto">\n                ${searchUI}`
);

fs.writeFileSync(path, content, 'utf8');
console.log('UX Injection complete!');
