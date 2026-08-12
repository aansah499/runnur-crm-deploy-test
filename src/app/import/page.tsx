'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { processCSV, CSVRow, ImportResult } from '@/actions/import';
import { UploadCloud, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [allRows, setAllRows] = useState<CSVRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null); // Reset previous results

      Papa.parse<CSVRow>(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setAllRows(results.data);
          setPreview(results.data.slice(0, 10));
        },
      });
    }
  };

  const handleImport = async () => {
    if (allRows.length === 0) return;
    setIsImporting(true);
    setResult(null);
    try {
      const res = await processCSV(allRows);
      setResult(res);
    } catch (error) {
      console.error('Import failed', error);
      alert('An error occurred during import. Check console for details.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Import CSV</h2>
        <p className="text-zinc-400">Upload your historical journey data to populate the CRM.</p>
      </div>

      {!result ? (
        <div className="space-y-6">
          <div className="glass-panel p-8 rounded-2xl border-dashed border-2 border-zinc-700 text-center">
            <UploadCloud className="w-12 h-12 text-brand mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Select CSV File</h3>
            <p className="text-zinc-400 mb-6 text-sm">Required columns: Customer Name, Phone, Email, Pickup Address, Dropoff Address, Booking Date, Fare, Status</p>
            <label className="cursor-pointer px-6 py-3 bg-brand hover:bg-brand-hover text-black font-medium rounded-lg transition-colors inline-block shadow-lg shadow-brand/20 w-full sm:w-auto">
              Browse Files
              <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>
            {file && <p className="mt-4 text-sm text-brand">Selected: {file.name} ({allRows.length} rows)</p>}
          </div>

          {preview.length > 0 && (
            <div className="glass-panel rounded-2xl overflow-hidden">
              <div className="p-4 md:p-6 border-b border-zinc-800/50 bg-zinc-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-lg font-medium text-white">Preview (First {preview.length} rows)</h3>
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="px-6 py-2 bg-brand text-black text-sm font-medium rounded-lg hover:bg-brand-hover transition-colors shadow-lg shadow-brand/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isImporting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isImporting ? 'Importing...' : 'Start Import'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-zinc-900/80 border-b border-zinc-800/50">
                      {Object.keys(preview[0] || {}).map((key) => (
                        <th key={key} className="py-3 px-4 font-medium text-zinc-400 whitespace-nowrap">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                    {preview.map((row, i) => (
                      <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="py-3 px-4 whitespace-nowrap">{val as string}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="glass-panel p-8 rounded-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4 relative z-10" />
            <h3 className="text-2xl font-bold text-white mb-2 relative z-10">Import Complete</h3>
            <p className="text-zinc-400 relative z-10">Your data has been successfully processed.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 relative z-10">
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                <div className="text-3xl font-bold text-white mb-1">{result.newCustomers}</div>
                <div className="text-sm text-zinc-400">New Customers</div>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                <div className="text-3xl font-bold text-white mb-1">{result.updatedCustomers}</div>
                <div className="text-sm text-zinc-400">Updated Customers</div>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                <div className="text-3xl font-bold text-white mb-1">{result.journeysAdded}</div>
                <div className="text-sm text-zinc-400">Journeys Added</div>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                <div className="text-3xl font-bold text-zinc-400 mb-1">{result.skippedRows}</div>
                <div className="text-sm text-zinc-500">Skipped Rows</div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <button
                onClick={() => {
                  setResult(null);
                  setFile(null);
                  setPreview([]);
                  setAllRows([]);
                }}
                className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors w-full sm:w-auto"
              >
                Import Another File
              </button>
              <Link href="/" className="px-6 py-2 bg-brand hover:bg-brand-hover text-black font-medium rounded-lg transition-colors shadow-lg shadow-brand/20 flex items-center justify-center w-full sm:w-auto">
                Back to Dashboard
              </Link>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl border border-red-900/30">
              <div className="flex items-center gap-3 mb-4 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-semibold text-lg">Import Warnings ({result.errors.length})</h3>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-200/70 max-h-64 overflow-y-auto pr-4">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
