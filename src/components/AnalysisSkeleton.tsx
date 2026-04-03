import { motion } from "framer-motion";

const ShimmerLine = ({ width = "100%", height = "h-4", delay = 0 }: { width?: string; height?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay }}
    className={`${height} rounded-lg relative overflow-hidden bg-secondary/50`}
    style={{ width }}
  >
    <div className="absolute inset-0 shimmer-effect" />
  </motion.div>
);

const AnalysisSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    {/* Header skeleton */}
    <div className="flex items-center justify-between">
      <ShimmerLine width="200px" height="h-7" />
      <div className="flex gap-2">
        <ShimmerLine width="120px" height="h-9" delay={0.05} />
        <ShimmerLine width="100px" height="h-9" delay={0.1} />
      </div>
    </div>

    {/* Summary skeleton */}
    <div className="glass rounded-2xl p-6 space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <ShimmerLine width="16px" height="h-4" />
        <ShimmerLine width="80px" height="h-3" delay={0.05} />
      </div>
      <ShimmerLine delay={0.1} />
      <ShimmerLine delay={0.15} />
      <ShimmerLine width="75%" delay={0.2} />
    </div>

    {/* Sentiment row skeleton */}
    <div className="glass rounded-2xl p-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3">
            <ShimmerLine width="90px" height="h-3" delay={i * 0.05} />
            <ShimmerLine width={i === 1 ? "100%" : "80px"} height="h-8" delay={0.1 + i * 0.05} />
          </div>
        ))}
      </div>
    </div>

    {/* Entities skeleton */}
    <div className="glass rounded-2xl p-6 space-y-5">
      <ShimmerLine width="140px" height="h-3" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2.5">
            <ShimmerLine width="70px" height="h-3" delay={i * 0.05} />
            <div className="flex gap-2">
              {[0, 1, 2].map((j) => (
                <ShimmerLine key={j} width={`${60 + j * 20}px`} height="h-6" delay={0.1 + (i * 3 + j) * 0.02} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Processing status */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center gap-3 py-4"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent"
      />
      <motion.span
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-sm text-muted-foreground"
      >
        AI is analyzing your document...
      </motion.span>
    </motion.div>
  </motion.div>
);

export default AnalysisSkeleton;
