import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Background3D from "@/components/Background3D";
import ThemeToggle from "@/components/ThemeToggle";
import AIAssistant from "@/components/AIAssistant";
import AnalysisSkeleton from "@/components/AnalysisSkeleton";
import {
  FileUp, Loader2, FileText, Image, File, Copy, CheckCircle2,
  LogOut, Sparkles, X, BarChart3, Users, Calendar, DollarSign,
  Download, History, Trash2, Clock, ChevronDown, ChevronUp, MapPin, Globe, Gauge,
  FileSpreadsheet, Presentation, FileCode
} from "lucide-react";

interface AnalysisResult {
  status: string;
  fileName: string;
  summary: string;
  entities: {
    names: string[];
    dates: string[];
    organizations: string[];
    amounts: string[];
    locations: string[];
  };
  sentiment: string;
  confidence: number;
  language: string;
}

interface HistoryItem {
  id: string;
  file_name: string;
  file_type: string;
  summary: string;
  entities: any;
  sentiment: string;
  created_at: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const entityIcons: Record<string, any> = {
  names: Users,
  dates: Calendar,
  organizations: BarChart3,
  amounts: DollarSign,
  locations: MapPin,
};

const entityColors: Record<string, string> = {
  names: "bg-primary/10 text-primary border-primary/20",
  dates: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  organizations: "bg-accent/10 text-accent border-accent/20",
  amounts: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  locations: "bg-sky-500/10 text-sky-400 border-sky-500/20",
};

const Dashboard = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const apiKey = "sk_track2_987654321";

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from("analysis_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (!error && data) setHistory(data as HistoryItem[]);
    setLoadingHistory(false);
  };

  const saveToHistory = async (res: AnalysisResult) => {
    if (!user) return;
    await supabase.from("analysis_history").insert({
      user_id: user.id,
      file_name: res.fileName,
      file_type: file ? getFileType(file) : "unknown",
      summary: res.summary,
      entities: res.entities,
      sentiment: res.sentiment,
    });
    fetchHistory();
  };

  const deleteHistory = async (id: string) => {
    await supabase.from("analysis_history").delete().eq("id", id);
    setHistory((h) => h.filter((item) => item.id !== id));
    toast({ title: "Deleted", description: "History entry removed." });
  };

  const getFileType = (f: File): string => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "pdf";
    if (["docx", "doc"].includes(ext || "")) return "docx";
    if (["xlsx", "xls", "csv"].includes(ext || "")) return "spreadsheet";
    if (["pptx", "ppt"].includes(ext || "")) return "presentation";
    if (["txt", "rtf", "md", "html", "xml", "json"].includes(ext || "")) return "text";
    if (["png", "jpg", "jpeg", "gif", "bmp", "webp", "tiff", "svg"].includes(ext || "")) return "image";
    return "unknown";
  };

  const getFileIcon = (type: string) => {
    if (type === "pdf") return <FileText className="w-5 h-5" />;
    if (type === "image") return <Image className="w-5 h-5" />;
    if (type === "spreadsheet") return <FileSpreadsheet className="w-5 h-5" />;
    if (type === "presentation") return <Presentation className="w-5 h-5" />;
    if (type === "text") return <FileCode className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const analyzeDocument = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const fileType = getFileType(file);
      if (fileType === "unknown") {
        toast({ title: "Unsupported file type", description: "Please upload a PDF, DOCX, or image file.", variant: "destructive" });
        setLoading(false);
        return;
      }
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
      }
      const fileBase64 = btoa(binary);
      const response = await fetch(`${SUPABASE_URL}/functions/v1/document-analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ fileName: file.name, fileType, fileBase64 }),
      });
      const data = await response.json();
      if (!response.ok || data.status === "error") {
        toast({ title: "Analysis failed", description: data.message || "Unknown error", variant: "destructive" });
      } else {
        setResult(data);
        saveToHistory(data);
        toast({ title: "Analysis complete", description: `Successfully analyzed ${file.name}` });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to analyze document", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyJSON = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadPDF = () => {
    if (!result) return;
    // Build a printable HTML document
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Analysis: ${result.fileName}</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #1a1a2e; }
  h1 { color: #0d9488; font-size: 28px; border-bottom: 3px solid #0d9488; padding-bottom: 12px; }
  h2 { color: #7c3aed; font-size: 18px; margin-top: 28px; }
  .badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; }
  .positive { background: #d1fae5; color: #065f46; }
  .negative { background: #fee2e2; color: #991b1b; }
  .neutral { background: #fef3c7; color: #92400e; }
  .entity-group { margin: 12px 0; }
  .entity-label { font-weight: 600; color: #6b7280; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; }
  .entity-tag { display: inline-block; margin: 4px 6px 4px 0; padding: 3px 10px; background: #f3f4f6; border-radius: 6px; font-size: 13px; }
  .summary { background: #f8fafc; padding: 16px 20px; border-radius: 10px; line-height: 1.7; border-left: 4px solid #0d9488; }
  .meta { color: #9ca3af; font-size: 12px; margin-top: 40px; }
  pre { background: #f1f5f9; padding: 16px; border-radius: 8px; font-size: 12px; overflow-x: auto; }
</style></head><body>
<h1>📄 Document Analysis Report</h1>
<p><strong>File:</strong> ${result.fileName}</p>
<p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
<h2>Summary</h2>
<div class="summary">${result.summary}</div>
<h2>Sentiment</h2>
<span class="badge ${result.sentiment.toLowerCase()}">${result.sentiment}</span>
<h2>Extracted Entities</h2>
${Object.entries(result.entities).map(([key, values]) => `
<div class="entity-group">
  <div class="entity-label">${key}</div>
  <div>${(values as string[]).length > 0 ? (values as string[]).map(v => `<span class="entity-tag">${v}</span>`).join("") : "<em style='color:#9ca3af'>None found</em>"}</div>
</div>`).join("")}
<h2>Raw JSON</h2>
<pre>${JSON.stringify(result, null, 2)}</pre>
<div class="meta">Generated by DocAnalyzer — AI-Powered Document Analysis</div>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    setTimeout(() => {
      w?.print();
      URL.revokeObjectURL(url);
    }, 500);
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setResult({
      status: "success",
      fileName: item.file_name,
      summary: item.summary,
      entities: item.entities,
      sentiment: item.sentiment,
      confidence: (item as any).confidence || 85,
      language: (item as any).language || "Unknown",
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const sentimentConfig: Record<string, { color: string; bg: string }> = {
    Positive: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    Negative: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
    Neutral: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Background3D />

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 glass-strong"
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.02 }}>
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <FileText className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight font-['Space_Grotesk']">DocAnalyzer</span>
              <span className="text-xs text-muted-foreground ml-2">Dashboard</span>
            </div>
          </motion.div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-xs text-muted-foreground hidden sm:block">{user.email}</span>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground gap-2">
                <LogOut className="w-4 h-4" /> Sign Out
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className={`glass rounded-2xl border-2 border-dashed transition-all duration-500 cursor-pointer glow-border-animate ${
              dragOver ? "border-primary bg-primary/5 shadow-glow scale-[1.01]" : "border-border/50 hover:border-primary/30"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input id="file-input" type="file" className="hidden" accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.pptx,.ppt,.txt,.rtf,.md,.html,.xml,.json,.png,.jpg,.jpeg,.gif,.bmp,.webp,.tiff,.svg" onChange={handleFileChange} />
            <div className="p-12 text-center">
              <motion.div
                animate={{ y: dragOver ? -8 : 0, rotate: dragOver ? 5 : 0 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="w-16 h-16 rounded-2xl bg-gradient-primary/10 flex items-center justify-center mx-auto mb-4"
              >
                <FileUp className="w-7 h-7 text-primary" />
              </motion.div>
              {file ? (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center justify-center gap-3">
                  {getFileIcon(getFileType(file))}
                  <span className="font-semibold">{file.name}</span>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{getFileType(file).toUpperCase()}</Badge>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}>
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                </motion.div>
              ) : (
                <>
                  <p className="text-muted-foreground mb-1 font-medium">Drop a document here or click to browse</p>
                  <p className="text-xs text-muted-foreground">Supports PDF, DOCX, XLSX, PPTX, TXT, CSV, RTF, PNG, JPG, and more</p>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={analyzeDocument}
              disabled={!file || loading}
              size="lg"
              className="bg-gradient-primary hover:opacity-90 shadow-glow text-primary-foreground px-10 h-12 text-base gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Analyze Document</>
              )}
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowHistory(!showHistory)}
              className="glass gap-2 h-12"
            >
              <History className="w-4 h-4" /> History
              {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </motion.div>
        </motion.div>

        {/* History Panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="glass rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <History className="w-4 h-4" /> Analysis History
                </h3>
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No analysis history yet. Analyze a document to get started!</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {history.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all duration-300 cursor-pointer group"
                        onClick={() => loadHistoryItem(item)}
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-primary/10 flex items-center justify-center shrink-0">
                          {getFileIcon(item.file_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.file_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-[10px] py-0 ${sentimentConfig[item.sentiment]?.bg || sentimentConfig.Neutral.bg}`}>
                              {item.sentiment}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => { e.stopPropagation(); deleteHistory(item.id); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Skeleton */}
        <AnimatePresence>
          {loading && !result && <AnalysisSkeleton />}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-2xl font-bold tracking-tight">Analysis Results</h2>
                <div className="flex gap-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" size="sm" onClick={downloadPDF} className="glass gap-2">
                      <Download className="w-3.5 h-3.5" /> Download PDF
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" size="sm" onClick={copyJSON} className="glass gap-2">
                      {copied ? <><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy JSON</>}
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Summary */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.005 }}
                className="glass rounded-2xl p-6 transition-all duration-300 hover:shadow-glow"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Summary</h3>
                </div>
                <p className="text-foreground leading-relaxed">{result.summary}</p>
              </motion.div>

              {/* Sentiment */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                whileHover={{ scale: 1.005 }}
                className="glass rounded-2xl p-6 transition-all duration-300 hover:shadow-glow"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sentiment</h3>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.3 }}>
                      <Badge className={`text-sm py-1.5 px-5 ${sentimentConfig[result.sentiment]?.bg || sentimentConfig.Neutral.bg}`}>
                        {result.sentiment}
                      </Badge>
                    </motion.div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5" /> Confidence
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2.5 rounded-full bg-secondary overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${result.confidence || 0}%` }}
                          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-primary"
                        />
                      </div>
                      <span className="text-sm font-bold text-primary">{result.confidence || 0}%</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Language
                    </h3>
                    <Badge className="bg-secondary text-foreground border-border text-sm py-1.5 px-4">
                      {result.language || "Unknown"}
                    </Badge>
                  </div>
                </div>
              </motion.div>

              {/* Entities */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.005 }}
                className="glass rounded-2xl p-6 transition-all duration-300 hover:shadow-glow"
              >
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">Extracted Entities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(["names", "dates", "organizations", "amounts", "locations"] as const).map((key, gi) => {
                    const Icon = entityIcons[key];
                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + gi * 0.1 }}
                        className="space-y-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{key}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {result.entities[key]?.length > 0 ? (
                            result.entities[key].map((item, i) => (
                              <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 + i * 0.05, type: "spring" }}>
                                <Badge className={`text-xs ${entityColors[key]}`}>{item}</Badge>
                              </motion.div>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">None found</span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Raw JSON */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="glass rounded-2xl p-6"
              >
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Raw Response</h3>
                <pre className="text-xs bg-secondary/50 rounded-xl p-5 overflow-x-auto text-muted-foreground font-mono leading-relaxed">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <AIAssistant />
    </div>
  );
};

export default Dashboard;
