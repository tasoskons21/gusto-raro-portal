import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface StatusModalProps {
  show: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
  onClose: () => void;
  autoCloseMs?: number;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  show,
  type,
  title,
  message,
  onClose,
  autoCloseMs = 3000
}) => {
  const isSuccess = type === 'success';

  React.useEffect(() => {
    if (show && autoCloseMs > 0) {
      const timer = setTimeout(onClose, autoCloseMs);
      return () => clearTimeout(timer);
    }
  }, [show, autoCloseMs, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
          >
            <div
              className={`relative bg-gradient-to-r ${
                isSuccess ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'
              } px-6 py-8 text-center`}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                {isSuccess ? (
                  <CheckCircle className="w-8 h-8 text-white" />
                ) : (
                  <XCircle className="w-8 h-8 text-white" />
                )}
              </div>

              <h3 className="text-xl font-bold text-white mb-1">
                {title}
              </h3>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 text-center mb-6">
                {message}
              </p>

              <button
                onClick={onClose}
                className={`w-full px-4 py-3 text-sm font-bold text-white bg-gradient-to-r ${
                  isSuccess
                    ? 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                    : 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                } rounded-xl transition-all uppercase tracking-wider`}
              >
                Κλείσιμο
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
