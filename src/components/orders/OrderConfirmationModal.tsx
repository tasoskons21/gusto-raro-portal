import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ShoppingBag, X } from 'lucide-react';

interface OrderConfirmationModalProps {
  show: boolean;
  onClose: () => void;
  orderId: string | null;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  show,
  onClose,
  orderId,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[40px] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center text-center p-10 border-4 border-white/20"
      >
        <div className="w-24 h-24 bg-gusto-green/10 rounded-full flex items-center justify-center mb-8 relative">
          <CheckCircle2 className="text-gusto-green" size={56} />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="absolute -top-2 -right-2 bg-gusto-gold text-white p-2 rounded-full shadow-lg"
          >
            <ShoppingBag size={20} />
          </motion.div>
        </div>

        <h2 className="text-3xl font-black text-gusto-green mb-3 tracking-tight uppercase">
          ΕΠΙΤΥΧΙΑ!
        </h2>
        <p className="text-slate-500 font-bold mb-8 leading-relaxed px-4 uppercase text-[10px] tracking-widest">
          Η ΠΑΡΑΓΓΕΛΙΑ ΣΑΣ ΚΑΤΑΧΩΡΗΘΗΚΕ ΜΕ ΕΠΙΤΥΧΙΑ ΚΑΙ ΕΙΝΑΙ ΕΤΟΙΜΗ ΓΙΑ ΕΠΕΞΕΡΓΑΣΙΑ.
        </p>

        <div className="bg-slate-50 w-full py-4 px-6 rounded-2xl border border-slate-100 mb-8">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ΑΡΙΘΜΟΣ ΠΑΡΑΓΓΕΛΙΑΣ</p>
          <p className="text-xl font-black text-gusto-green font-mono">{orderId}</p>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gusto-green text-white font-black py-5 rounded-2xl hover:bg-gusto-green-light hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-gusto-green/20 flex items-center justify-center gap-2 text-lg"
        >
          ΝΕΑ ΠΑΡΑΓΓΕΛΙΑ
          <X size={20} />
        </button>
      </motion.div>
    </div>
  );
};
