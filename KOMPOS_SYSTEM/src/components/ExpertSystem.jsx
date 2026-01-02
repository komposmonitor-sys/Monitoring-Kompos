import React, { useState } from 'react';
import { Sliders, Sparkles, BrainCircuit, Wind, Activity } from 'lucide-react';
import clsx from 'clsx';
import { calculateFuzzy } from '../utils/fuzzyLogic';

export default function ExpertSystem({ isDark }) {
    // Manual inputs only
    const [inputs, setInputs] = useState({
        suhu: 35,
        kelembapan: 50,
        ph: 7.0,
        // ammonia: 0, // Removed from UI as requested
        bau: 1.5 // Default: Tidak Bau (1.5)
    });

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleInput = (key, value) => {
        setInputs(prev => ({ ...prev, [key]: parseFloat(value) }));
    };

    const handleAnalyze = (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        // Simulate calculation delay for effect
        setTimeout(() => {
            const res = calculateFuzzy(
                inputs.suhu,
                inputs.ph,
                inputs.kelembapan,
                0, // Default Ammonia to 0 since we removed the input
                inputs.bau
            );
            setResult(res);
            setLoading(false);
        }, 800);
    };

    // Color Logic
    const getColor = (label) => {
        if (!label) return "text-slate-500";
        if (label.includes('Buruk')) return "text-red-500";
        if (label.includes('Sedang')) return "text-amber-500";
        if (label.includes('Baik')) return "text-emerald-400";
        // Sangat Baik
        return "text-emerald-500";
    };

    const resultColor = result ? getColor(result.label) : "";

    return (
        <div className="mt-12 animate-fade-in-up">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-500/10 p-3 rounded-full">
                        <BrainCircuit className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            Expert System Analysis
                        </h2>
                        <p className={clsx("text-sm", isDark ? "text-slate-400" : "text-slate-500")}>
                            Manual Quality Check Simulation
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                {/* INPUT FORM */}
                <div className={clsx(
                    "rounded-3xl p-8 shadow-xl border transition-all relative",
                    isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"
                )}>
                  
