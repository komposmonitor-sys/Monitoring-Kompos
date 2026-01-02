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
                    <h3 className={clsx("flex items-center gap-2 text-xl font-bold mb-6", isDark ? "text-emerald-400" : "text-emerald-600")}>
                        <Sliders className="w-5 h-5" />
                        Input Parameter
                    </h3>

                    <form onSubmit={handleAnalyze} className="space-y-6">
                        {/* Suhu */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium block">Temperature (°C)</label>
                            <input
                                type="number"
                                min="0" max="100" step="any" // Changed to 'any' for decimals
                                value={inputs.suhu}
                                onChange={(e) => handleInput('suhu', e.target.value)}
                                className={clsx(
                                    "w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all cursor-pointer hover:bg-slate-50/5",
                                    isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                                )}
                                placeholder="Enter Temperature..."
                            />
                        </div>

                        {/* Kelembapan */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium block">Moisture (%)</label>
                            <input
                                type="number"
                                min="0" max="100" step="any" // Changed to 'any'
                                value={inputs.kelembapan}
                                onChange={(e) => handleInput('kelembapan', e.target.value)}
                                className={clsx(
                                    "w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer hover:bg-slate-50/5",
                                    isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                                )}
                                placeholder="Enter Moisture..."
                            />
                        </div>

                        {/* pH */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium block">Acidity (pH)</label>
                            <input
                                type="number"
                                min="0" max="14" step="any" // Changed to 'any'
                                value={inputs.ph}
                                onChange={(e) => handleInput('ph', e.target.value)}
                                className={clsx(
                                    "w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all cursor-pointer hover:bg-slate-50/5",
                                    isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                                )}
                                placeholder="Enter pH Level..."
                            />
                        </div>

                        {/* Ammonia Removed */}

                        {/* Bau */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Wind size={16} />
                                Smell Condition (Bau)
                            </label>
                            <select
                                value={inputs.bau}
                                onChange={(e) => handleInput('bau', e.target.value)}
                                className={clsx(
                                    "w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all appearance-none cursor-pointer hover:bg-slate-50/5",
                                    isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                                )}
                            >
                                <option value="1.5">1. Tidak Bau (Aroma Tanah)</option>
                                <option value="5.0">2. Cukup Bau (Agak Menyengat)</option>
                                <option value="9.0">3. Bau Busuk (Menyengat)</option>
                            </select>
                        </div>

                        <button type="submit"
                            disabled={loading}
                            className="w-full py-3 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transform hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                            <Sparkles className="w-5 h-5" />
                            {loading ? "Calculating..." : "Analyze Quality"}
                        </button>
                    </form>
                </div>
                

