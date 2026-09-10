import { useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { ArrowLeft, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import Papa from 'papaparse';

export default function BulkCreate() {
  const { user } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<{ success: number, failed: number } | null>(null);
  const [error, setError] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    setError('');
    
    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          setError('Failed to parse CSV. Make sure it has correct headers.');
        } else {
          setPreviewData(result.data.slice(0, 5)); // Show first 5
        }
      }
    });
  };

  const generateShortCode = () => 'b_' + Math.random().toString(36).substring(2, 8);

  const processBulk = async () => {
    if (!file || !user) return;
    
    setLoading(true);
    setResults(null);
    setError('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const rows = result.data as any[];
        setProgress({ current: 0, total: rows.length });
        
        let successCount = 0;
        let failedCount = 0;
        
        // We do batching to not overwhelm the database
        const batchSize = 50;
        
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          
          const inserts = batch.map(row => {
             let url = row.url || row.destination_url || row.destinationUrl;
             if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
             
             return {
                user_id: user.id,
                destination_url: url,
                short_code: row.short_code || generateShortCode(),
                keyword: row.keyword || null,
                qr_type: row.type || 'url',
                design_config: {}
             };
          }).filter(x => x.destination_url); // Only valid URLs
          
          if (inserts.length > 0) {
            const { error: insertError } = await supabase.from('qr_codes').insert(inserts);
            
            if (insertError) {
              console.error(insertError);
              failedCount += inserts.length;
            } else {
              successCount += inserts.length;
            }
          } else {
            failedCount += batch.length;
          }
          
          setProgress(p => ({ ...p, current: Math.min(i + batchSize, rows.length) }));
        }
        
        setResults({ success: successCount, failed: failedCount });
        setLoading(false);
      }
    });
  };

  return (
    <div className="h-screen w-full bg-background flex flex-col">
      <nav className="flex items-center p-4 bg-surface-container-low border-b border-outline-variant">
        <Link to="/" className="p-2 -ml-2 rounded-full hover:bg-surface-variant text-on-surface-variant">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <span className="font-bold text-lg ml-2">Bulk QR Generator</span>
      </nav>

      <main className="flex-1 overflow-y-auto p-6 md:p-12 bg-surface-container-lowest">
        <div className="max-w-3xl mx-auto">
          
          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center mx-auto mb-6">
              <UploadCloud className="w-8 h-8 text-on-primary-container" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Upload CSV to Generate</h1>
            <p className="text-on-surface-variant">
              Generate hundreds of QR codes at once. Your CSV must contain a <code>url</code> column.
            </p>
          </div>

          {!results && (
            <div className="bg-surface border border-outline-variant rounded-[2rem] p-8 shadow-sm">
              <div className="border-2 border-dashed border-outline-variant rounded-2xl p-10 text-center hover:bg-surface-variant/50 transition-colors cursor-pointer relative">
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={loading}
                />
                <UploadCloud className="w-10 h-10 text-on-surface-variant mx-auto mb-4" />
                <p className="font-semibold text-lg">{file ? file.name : 'Click or drag CSV here'}</p>
                <p className="text-on-surface-variant text-sm mt-2">Maximum 5,000 rows per file</p>
              </div>

              {error && (
                <div className="mt-6 p-4 bg-error-container text-on-error-container rounded-xl flex gap-3">
                  <AlertCircle className="shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {previewData.length > 0 && !loading && (
                <div className="mt-8">
                  <h3 className="font-bold text-lg mb-4">Data Preview</h3>
                  <div className="overflow-x-auto rounded-xl border border-outline-variant">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-surface-variant text-on-surface-variant">
                        <tr>
                          {Object.keys(previewData[0]).map(k => <th key={k} className="p-3">{k}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, i) => (
                          <tr key={i} className="border-t border-outline-variant">
                            {Object.values(row).map((v: any, j) => <td key={j} className="p-3 truncate max-w-[150px]">{v}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-2 text-right">* Showing first 5 rows</p>
                  
                  <Button 
                    onClick={processBulk} 
                    className="w-full mt-6 rounded-xl py-6 text-lg font-bold"
                  >
                    Start Processing
                  </Button>
                </div>
              )}

              {loading && (
                <div className="mt-8 text-center space-y-4">
                  <p className="font-bold text-lg">Generating {progress.total} QR Codes...</p>
                  <div className="w-full h-4 bg-surface-variant rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-on-surface-variant font-mono">{progress.current} / {progress.total} completed</p>
                </div>
              )}
            </div>
          )}

          {results && (
            <div className="bg-surface border border-outline-variant rounded-[2rem] p-10 shadow-sm text-center">
              <div className="w-20 h-20 bg-secondary-container rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-on-secondary-container" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Batch Complete!</h2>
              <p className="text-on-surface-variant mb-8 text-lg">Your QR codes have been successfully generated.</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-surface-variant/50 p-6 rounded-2xl">
                  <p className="text-3xl font-bold text-secondary-dark">{results.success}</p>
                  <p className="text-on-surface-variant font-medium mt-1">Created Successfully</p>
                </div>
                <div className="bg-error-container/30 p-6 rounded-2xl">
                  <p className="text-3xl font-bold text-error">{results.failed}</p>
                  <p className="text-on-surface-variant font-medium mt-1">Failed</p>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button asChild variant="outline" size="lg" className="rounded-full">
                  <Link to="/">Return to Dashboard</Link>
                </Button>
                <Button onClick={() => setResults(null)} size="lg" className="rounded-full">
                  Upload Another CSV
                </Button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
