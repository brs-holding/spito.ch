import { motion, AnimatePresence } from "framer-motion";
import type { PropsWithChildren } from "react";

interface LoadingTransitionProps extends PropsWithChildren {
  isLoading?: boolean;
}

export function LoadingTransition({ children, isLoading }: LoadingTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center justify-center min-h-[200px]"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
