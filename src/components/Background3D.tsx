import { motion } from "framer-motion";

const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 4 + 2,
  duration: Math.random() * 6 + 4,
  delay: Math.random() * 4,
  color: i % 3 === 0 ? "bg-primary" : i % 3 === 1 ? "bg-accent" : "bg-sky-400",
}));

const Background3D = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    {/* 3D grid floor */}
    <div className="scene-3d absolute inset-0">
      <div className="plane-3d w-full h-full relative">
        <div className="grid-3d" />
      </div>
    </div>

    {/* Mesh gradient */}
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse 80% 60% at 10% 20%, hsl(160 84% 39% / 0.07) 0%, transparent 60%),
          radial-gradient(ellipse 60% 80% at 85% 30%, hsl(270 70% 60% / 0.06) 0%, transparent 60%),
          radial-gradient(ellipse 70% 50% at 50% 80%, hsl(200 90% 50% / 0.05) 0%, transparent 60%)
        `
      }} />
    </div>

    {/* Floating orbs */}
    <motion.div
      animate={{ x: [0, 30, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.05, 0.95, 1] }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-3xl"
    />
    <motion.div
      animate={{ x: [0, -20, 30, 0], y: [0, 20, -30, 0], scale: [1, 0.95, 1.05, 1] }}
      transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-accent/[0.04] blur-3xl"
    />
    <motion.div
      animate={{ x: [0, 15, -15, 0], y: [0, -20, 15, 0] }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-sky-500/[0.03] blur-3xl"
    />

    {/* Particles */}
    {particles.map((p) => (
      <div
        key={p.id}
        className={`particle absolute rounded-full ${p.color}/30`}
        style={{
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: p.size,
          height: p.size,
          "--duration": `${p.duration}s`,
          "--delay": `${p.delay}s`,
        } as React.CSSProperties}
      />
    ))}

    {/* Pulse rings */}
    <div className="pulse-ring absolute top-1/4 left-1/4 w-40 h-40 rounded-full border border-primary/10" />
    <div className="pulse-ring absolute bottom-1/3 right-1/4 w-60 h-60 rounded-full border border-accent/10" style={{ animationDelay: "1.5s" }} />
  </div>
);

export default Background3D;
