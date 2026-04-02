import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  show: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  show,
  title,
  message,
  confirmLabel = 'Επιβεβαίωση',
  cancelLabel = 'Ακύρωση',
  variant = 'danger',
  onConfirm,
  onCancel,
  isProcessing = false
}) => {
  const variantConfig = {
    danger: {
      gradient: 'from-red-500 to-red-600',
      iconBg: 'bg-white/20',
      iconColor: 'text-white',
      confirmBg: 'from-red-500 to-red-600',
      confirmHover: 'hover:from-red-600 hover:to-red-700',
      icon: Trash2
    },
    warning: {
      gradient: 'from-amber-500 to-amber-600',
      iconBg: 'bg-white/20',
      iconColor: 'text-white',
      confirmBg: 'from-amber-500 to-amber-600',
      confirmHover: 'hover:from-amber-600 hover:to-amber-700',
      icon: AlertTriangle
    },
    info: {
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-white/20',
      iconColor: 'text-white',
      confirmBg: 'from-blue-500 to-blue-600',
      confirmHover: 'hover:from-blue-600 hover:to-blue-700',
      icon: AlertTriangle
    }
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
          >
            <div className={`relative bg-gradient-to-r ${config.gradient} px-6 py-8 text-center`}>
              <button
                onClick={onCancel}
                disabled={isProcessing}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>

              <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${config.iconBg} flex items-center justify-center`}>
                <Icon className={`w-8 h-8 ${config.iconColor}`} />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                {title}
              </h3>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 text-center mb-6">
                {message}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isProcessing}
                  className={`flex-1 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r ${config.confirmBg} ${config.confirmHover} rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Περιμένετε...
                    </>
                  ) : (
                    <>
                      <Icon className="w-4 h-4" />
                      {confirmLabel}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
