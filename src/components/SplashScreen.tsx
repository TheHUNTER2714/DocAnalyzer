import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Sparkles, Zap, Brain } from "lucide-react";

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(() => setPhase(3), 2000);
    const t4 = setTimeout(() => setPhase(4), 2800);
    const t5 = setTimeout(() => onComplete(), 3400);
    return () => { [t1, t2, t3, t4, t5].forEach(clearTimeout); };
  }, [onComplete]);

  // Orbiting icons around the main logo
  const orbitIcons = [
    { Icon: Sparkles, delay: 0.6, angle: 0 },
    { Icon: Zap, delay: 0.8, angle: 120 },
    { Icon: Brain, delay: 1.0, angle: 240 },
  ];

  return (
    <AnimatePresence>
      {phase < 4 && (
        <motion.div
          exit={{ opacity: 0, scale: 1.15, filter: "blur(10px)" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden"
        >
          {/* Radial pulse rings */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`ring-${i}`}
              className="absolute rounded-full border border-primary/20"
              initial={{ width: 0, height: 0, opacity: 0.8 }}
              animate={{
                width: [0, 400 + i * 200],
                height: [0, 400 + i * 200],
                opacity: [0.6, 0],
              }}
              transition={{
                delay: 0.3 + i * 0.4,
                duration: 2,
                ease: "easeOut",
                repeat: Infinity,
                repeatDelay: 1.5,
              }}
            />
          ))}

          {/* Floating particles */}
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
                background: i % 3 === 0
                  ? "hsl(160 84% 39% / 0.6)"
                  : i % 3 === 1
                  ? "hsl(270 70% 60% / 0.5)"
                  : "hsl(200 90% 50% / 0.5)",
              }}
              initial={{
                x: (Math.random() - 0.5) * 600,
                y: (Math.random() - 0.5) * 600,
                scale: 0,
                opacity: 0,
              }}
              animate={{
                scale: [0, 1.5, 0.8, 1.2, 0],
                opacity: [0, 1, 0.6, 0.8, 0],
                x: (Math.random() - 0.5) * 300,
                y: (Math.random() - 0.5) * 300,
              }}
              transition={{
                delay: 0.5 + i * 0.06,
                duration: 2.5,
                ease: "easeOut",
              }}
            />
          ))}

          {/* DNA-like helix lines */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`line-${i}`}
              className="absolute h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
              style={{ width: 200 + i * 40, rotate: `${i * 30}deg` }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: [0, 1, 0.6], opacity: [0, 0.8, 0] }}
              transition={{ delay: 0.8 + i * 0.15, duration: 1.8, ease: "easeOut" }}
            />
          ))}

          <div className="relative flex flex-col items-center gap-6">
            {/* Orbiting icons */}
            {orbitIcons.map(({ Icon, delay, angle }, idx) => (
              <motion.div
                key={idx}
                className="absolute"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0.6],
                  scale: [0, 1, 1, 0.8],
                  x: Math.cos((angle + phase * 60) * (Math.PI / 180)) * 80,
                  y: Math.sin((angle + phase * 60) * (Math.PI / 180)) * 80,
                }}
                transition={{ delay, duration: 2, ease: "easeOut" }}
              >
                <Icon className="w-5 h-5 text-primary/60" />
              </motion.div>
            ))}

            {/* Main logo with morphing glow */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.1 }}
              className="relative"
            >
              {/* Animated glow layers */}
              <motion.div
                className="absolute -inset-4 rounded-3xl opacity-0"
                animate={{
                  opacity: [0, 0.5, 0.3, 0.5, 0.3],
                  scale: [0.8, 1.1, 1.05, 1.1, 1.05],
                  background: [
                    "radial-gradient(circle, hsl(160 84% 39% / 0.4), transparent 70%)",
                    "radial-gradient(circle, hsl(270 70% 60% / 0.4), transparent 70%)",
                    "radial-gradient(circle, hsl(200 90% 50% / 0.4), transparent 70%)",
                    "radial-gradient(circle, hsl(160 84% 39% / 0.4), transparent 70%)",
                  ],
                }}
                transition={{ delay: 0.3, duration: 3, repeat: Infinity }}
              />

              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 0px hsl(160 84% 39% / 0)",
                    "0 0 60px hsl(160 84% 39% / 0.5)",
                    "0 0 40px hsl(270 70% 60% / 0.3)",
                    "0 0 50px hsl(160 84% 39% / 0.4)",
                  ],
                }}
                transition={{ duration: 2, delay: 0.4, repeat: Infinity, repeatType: "reverse" }}
                className="w-24 h-24 rounded-2xl bg-gradient-primary flex items-center justify-center relative"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-2xl border border-primary-foreground/10"
                />
                <FileText className="w-12 h-12 text-primary-foreground relative z-10" />
              </motion.div>

              {/* Expanding ring burst */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`burst-${i}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: [1, 1.8 + i * 0.3, 2 + i * 0.4],
                    opacity: [0.7, 0.2, 0],
                  }}
                  transition={{ duration: 1.5, delay: 0.2 + i * 0.2, repeat: 1, repeatDelay: 2 }}
                  className="absolute inset-0 rounded-2xl border-2 border-primary/40"
                />
              ))}
            </motion.div>

            {/* Title with stagger */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center"
            >
              <h1 className="text-4xl font-bold tracking-tight font-['Space_Grotesk']">
                {"DocAnalyzer".split("").map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.05 * i, duration: 0.3 }}
                    className={i < 3 ? "text-gradient-primary inline-block" : "inline-block"}
                  >
                    {char}
                  </motion.span>
                ))}
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5 }}
                className="text-sm text-muted-foreground mt-3 tracking-widest uppercase"
              >
                AI-Powered Document Intelligence
              </motion.p>
            </motion.div>

            {/* Animated loading bar with glow */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={phase >= 1 ? { opacity: 1, width: 200 } : {}}
              className="h-1.5 rounded-full bg-secondary overflow-hidden relative"
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={phase >= 1 ? { x: "200%" } : {}}
                transition={{ duration: 1.8, ease: "easeInOut" }}
                className="h-full w-1/2 bg-gradient-primary rounded-full"
                style={{ boxShadow: "0 0 15px hsl(160 84% 39% / 0.5)" }}
              />
            </motion.div>

            {/* Status text */}
            <AnimatePresence mode="wait">
              {phase >= 2 && phase < 4 && (
                <motion.p
                  key={phase}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 0.7, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xs text-muted-foreground"
                >
                  {phase === 2 ? "Initializing AI engine..." : "Ready"}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
