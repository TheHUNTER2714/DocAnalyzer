import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileUp, Loader2, FileText, Image, File, Copy, CheckCircle2 } from "lucide-react";

interface AnalysisResult {
  status: string;
  fileName: string;
  summary: string;
  entities: {
    names: string[];
    dates: string[];
    organizations: string[];
    amounts: string[];
  };
  sentiment: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [apiKey, setApiKey] = useState("sk_track2_987654321");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const getFileType = (file: File): string => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "pdf";
    if (ext === "docx") return "docx";
    if (["png", "jpg", "jpeg", "gif", "bmp", "webp", "tiff"].includes(ext || "")) return "image";
    return "unknown";
  };

  const getFileIcon = (type: string) => {
    if (type === "pdf") return <FileText className="w-5 h-5" />;
    if (type === "image") return <Image className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
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
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType,
          fileBase64,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status === "error") {
        toast({ title: "Analysis failed", description: data.message || "Unknown error", variant: "destructive" });
      } else {
        setResult(data);
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

  const sentimentColor = (s: string) => {
    if (s === "Positive") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (s === "Negative") return "bg-red-500/10 text-red-400 border-red-500/20";
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-10 bg-background/80">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">DocAnalyzer</h1>
          <Badge variant="secondary" className="text-xs ml-auto">AI-Powered</Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Upload Area */}
        <Card className="border-dashed border-2 border-border hover:border-primary/50 transition-colors">
          <div
            className="p-10 text-center cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input id="file-input" type="file" className="hidden" accept=".pdf,.docx,.png,.jpg,.jpeg,.gif,.bmp,.webp,.tiff" onChange={handleFileChange} />
            <FileUp className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                {getFileIcon(getFileType(file))}
                <span className="font-medium">{file.name}</span>
                <Badge variant="outline" className="text-xs">{getFileType(file).toUpperCase()}</Badge>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground mb-1">Drop a document here or click to browse</p>
                <p className="text-xs text-muted-foreground">PDF, DOCX, or Image files</p>
              </>
            )}
          </div>
        </Card>

        {/* API Key + Analyze */}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-sm text-muted-foreground mb-1.5 block">API Key</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-secondary border border-border text-sm font-mono text-foreground"
              placeholder="sk_track2_..."
            />
          </div>
          <Button onClick={analyzeDocument} disabled={!file || loading} size="lg">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : "Analyze Document"}
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Analysis Results</h2>
              <Button variant="outline" size="sm" onClick={copyJSON}>
                {copied ? <><CheckCircle2 className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy JSON</>}
              </Button>
            </div>

            {/* Summary */}
            <Card className="p-5">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Summary</h3>
              <p className="text-foreground leading-relaxed">{result.summary}</p>
            </Card>

            {/* Sentiment */}
            <Card className="p-5">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Sentiment</h3>
              <Badge className={sentimentColor(result.sentiment)}>{result.sentiment}</Badge>
            </Card>

            {/* Entities */}
            <Card className="p-5">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Extracted Entities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["names", "dates", "organizations", "amounts"] as const).map((key) => (
                  <div key={key} className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{key}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.entities[key]?.length > 0 ? (
                        result.entities[key].map((item, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">None found</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Raw JSON */}
            <Card className="p-5">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Raw Response</h3>
              <pre className="text-xs bg-secondary rounded-md p-4 overflow-x-auto text-foreground font-mono">
                {JSON.stringify(result, null, 2)}
              </pre>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
