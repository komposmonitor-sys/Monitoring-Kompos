import React from 'react';
import { History, Clock, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export default function HistoryTable({ data, isDark }) {
    const isMature = (status) => status && status.toLowerCase().includes("matang") && !status.toLowerCase().includes("belum");

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={clsx(
                "rounded-3xl border shadow-sm overflow-hidden",
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            )}
        >
            <div className={clsx(
                "p-6 border-b flex items-center justify-between",
                isDark ? "border-slate-800" : "border-slate-100"
            )}>
                <div className="flex items-center gap-3">
                    <div className={clsx("p-2 rounded-lg", isDark ? "bg-slate-800" : "bg-slate-100")}>
                        <History className={clsx("w-5 h-5", isDark ? "text-slate-400" : "text-slate-500")} />
                    </div>
                    <h3 className={clsx("font-bold text-lg", isDark ? "text-slate-100" : "text-slate-800")}>Recent History</h3>
                </div>
                <span className={clsx("text-xs font-medium px-3 py-1 rounded-full", isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500")}>Recent 5 Entries</span>
            </div>
