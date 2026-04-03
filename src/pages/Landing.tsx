import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Background3D from "@/components/Background3D";
import ThemeToggle from "@/components/ThemeToggle";
import TypingAnimation from "@/components/TypingAnimation";
import {
  FileText, Brain, Shield, Zap, Layers, BarChart3,
  ArrowRight, Sparkles, ChevronRight, FileSearch, Download, History, Eye
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  })
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  })
};

const features = [
  { icon: FileSearch, title: "Multi-Format OCR", desc: "Extract text from PDFs, DOCX files, and images with advanced optical character recognition." },
  { icon: Brain, title: "AI Summarization", desc: "Get concise, accurate summaries powered by state-of-the-art language models." },
  { icon: Layers, title: "Entity Extraction", desc: "Automatically identify names, dates, organizations, and monetary amounts." },
  { icon: BarChart3, title: "Sentiment Analysis", desc: "Understand the emotional tone of documents with precise sentiment classification." },
  { icon: Shield, title: "Secure Processing", desc: "Enterprise-grade API key authentication with encrypted data transmission." },
  { icon: Zap, title: "Real-time Results", desc: "Get instant analysis results with our optimized processing pipeline." },
  { icon: Download, title: "PDF Reports", desc: "Download beautifully formatted PDF reports of your document analysis." },
  { icon: History, title: "Analysis History", desc: "Access your previous analyses anytime from your personalized dashboard." },
  { icon: Eye, title: "Live Preview", desc: "See real-time extraction results as documents are being processed." },
];

const steps = [
  { num: "01", title: "Upload Document", desc: "Drag & drop or browse to upload your PDF, DOCX, or image file." },
  { num: "02", title: "AI Processing", desc: "Our AI engine extracts text, analyzes content, and identifies key entities." },
  { num: "03", title: "Get Insights", desc: "Receive structured results with summary, entities, sentiment, and download as PDF." },
];

const stats = [
  { value: "99.2%", label: "Extraction Accuracy" },
  { value: "<3s", label: "Avg Response Time" },
  { value: "15+", label: "File Formats" },
  { value: "256-bit", label: "Encryption" },
];

const Landing = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-background">
      <Background3D />

      {/* Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 glass-strong"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <FileText className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight font-['Space_Grotesk']">DocAnalyzer</span>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-medium">v2.0</Badge>
          </motion.div>
          <div className="hidden md:flex items-center gap-8">
            {["Features", "How It Works", "API"].map((item) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors relative"
                whileHover={{ y: -1 }}
              >
                {item}
              </motion.a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Sign In</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="sm" className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow text-primary-foreground">
                  Get Started <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 py-1.5 px-4 text-xs font-medium glow-border-animate">
              <Sparkles className="w-3 h-3 mr-1.5" /> AI-Powered Document Intelligence
            </Badge>
          </motion.div>
          <motion.h1
            variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] mb-6"
          >
            Extract <TypingAnimation />
            <br />from any document
          </motion.h1>
          <motion.p
            variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Transform PDFs, DOCX files, and images into structured data with AI-powered summarization, entity extraction, and sentiment analysis.
          </motion.p>
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?mode=signup">
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-all shadow-glow text-primary-foreground text-base px-8 h-13">
                  Start Analyzing <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            </Link>
            <a href="#api">
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="outline" className="border-border/80 hover:bg-secondary text-base px-8 h-13">
                  View API Docs <ChevronRight className="w-4 h-4" />
                </Button>
              </motion.div>
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible" custom={4}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((s, i) => (
              <motion.div key={i} variants={scaleIn} initial="hidden" animate="visible" custom={i + 5}
                whileHover={{ scale: 1.05, y: -4 }}
                className="glass rounded-2xl p-5 text-center transition-all duration-300 hover:shadow-glow"
              >
                <div className="text-2xl md:text-3xl font-bold color-cycle">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="text-center mb-16">
            <motion.div variants={fadeUp} custom={0}>
              <Badge className="mb-4 bg-accent/10 text-accent border-accent/20 text-xs">Core Capabilities</Badge>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Powerful <span className="text-gradient-accent">features</span> built for scale
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg max-w-xl mx-auto">
              Everything you need to process, analyze, and extract intelligence from documents.
            </motion.p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
                custom={i}
                whileHover={{ scale: 1.03, y: -6 }}
                className="group glass rounded-2xl p-7 hover:border-primary/30 transition-all duration-500 hover:shadow-glow cursor-default"
              >
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="w-11 h-11 rounded-xl bg-gradient-primary/10 flex items-center justify-center mb-5 group-hover:shadow-glow transition-shadow"
                >
                  <f.icon className="w-5 h-5 text-primary" />
                </motion.div>
                <h3 className="text-lg font-semibold mb-2 tracking-tight">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="relative z-10 py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.div variants={fadeUp} custom={0}>
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs">Workflow</Badge>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Three steps to <span className="text-gradient-primary">intelligence</span>
            </motion.h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                custom={i}
                whileHover={{ y: -8 }}
                className="relative glass rounded-2xl p-8 transition-all duration-300 hover:shadow-glow"
              >
                <div className="text-6xl font-bold text-gradient-primary opacity-20 mb-4">{s.num}</div>
                <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 -right-6 z-20">
                    <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <ArrowRight className="w-5 h-5 text-primary/40" />
                    </motion.div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* API Section */}
      <section id="api" className="relative z-10 py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <motion.div variants={fadeUp} custom={0}>
              <Badge className="mb-4 bg-accent/10 text-accent border-accent/20 text-xs">REST API</Badge>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Simple, powerful <span className="text-gradient-accent">API</span>
            </motion.h2>
          </motion.div>
          <motion.div
            variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
            whileHover={{ scale: 1.01 }}
            className="glass rounded-2xl p-6 overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-primary/60" />
              <span className="text-xs text-muted-foreground ml-2 font-mono">cURL</span>
            </div>
            <pre className="text-xs md:text-sm font-mono text-muted-foreground overflow-x-auto leading-relaxed">
{`curl -X POST https://your-domain.com/api/document-analyze \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: sk_track2_987654321" \\
  -d '{
    "fileName": "report.pdf",
    "fileType": "pdf",
    "fileBase64": "JVBERi0xLjQK..."
  }'`}
            </pre>
          </motion.div>
          <motion.div
            variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
            whileHover={{ scale: 1.01 }}
            className="glass rounded-2xl p-6 mt-5 overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-primary/60" />
              <span className="text-xs text-muted-foreground ml-2 font-mono">Response</span>
            </div>
            <pre className="text-xs md:text-sm font-mono text-primary/80 overflow-x-auto leading-relaxed">
{`{
  "status": "success",
  "fileName": "report.pdf",
  "summary": "This document is an invoice issued by...",
  "entities": {
    "names": ["Ravi Kumar"],
    "dates": ["10 March 2026"],
    "organizations": ["ABC Pvt Ltd"],
    "amounts": ["₹10,000"],
    "locations": ["Mumbai, India"]
  },
  "sentiment": "Neutral",
  "confidence": 94,
  "language": "English"
}`}
            </pre>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-32 px-6">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div variants={scaleIn} custom={0} className="glass rounded-3xl p-12 md:p-16 relative overflow-hidden glow-border-animate">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Ready to get started?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
                Create your account and start extracting insights from documents in seconds.
              </p>
              <Link to="/auth?mode=signup">
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="inline-block">
                  <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow text-primary-foreground text-base px-10 h-13">
                    Create Free Account <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">DocAnalyzer</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 DocAnalyzer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
