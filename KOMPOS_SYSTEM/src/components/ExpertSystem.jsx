import clsx from 'clsx';
import { BrainCircuit, Sliders, Sparkles, Wind } from 'lucide-react';
import React, { useState } from 'react';
// Pastikan file logic ini juga diperbarui (lihat di bawah)
import { calculateFuzzy } from '../utils/fuzzyLogic';

export default function ExpertSystem({ isDark }) {
    // State Input Manual
    const [inputs, setInputs] = useState({
        suhu: 45,       // Default Ideal
        kelembapan: 46, // Default Sedang
        ph: 7.0,        // Default Netral
        bau: 5          // Default Tidak Bau (5 PPM)
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

        // Simulasi delay agar terlihat seperti berpikir
        setTimeout(() => {
            // Panggil fungsi logic JS (Mirip dengan Python)
            const res = calculateFuzzy(
                inputs.suhu,
                inputs.kelembapan,
                inputs.ph,
                inputs.bau // Input ke-4 (Bau/Ammonia)
            );

            setResult(res);
            setLoading(false);
        }, 800);
    };

    // Helper Warna Label
    const getColor = (label) => {
        if (!label) return "text-slate-500";
        if (label.includes('BURUK')) return "text-red-500";
        if (label.includes('SEDANG')) return "text-amber-500";
        if (label.includes('SANGAT BAIK')) return "text-emerald-500";
        return "text-emerald-400"; // BAIK
    };

    const resultColor = result ? getColor(result.label) : "";

    return (
        <div className="mt-12 animate-fade-in-up">
            {/* --- HEADER --- */}
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
                            Simulasi 4 Variabel (Suhu, pH, Moisture, Bau)
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">

                {/* --- INPUT FORM --- */}
                <div className={clsx(
                    "rounded-3xl p-8 shadow-xl border transition-all relative flex flex-col h-full",
                    isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"
                )}>
                    <h3 className={clsx("flex items-center gap-2 text-xl font-bold mb-6", isDark ? "text-emerald-400" : "text-emerald-600")}>
                        <Sliders className="w-5 h-5" />
                        Input Parameter
                    </h3>

                    <form onSubmit={handleAnalyze} className="space-y-6">
                        {/* 1. Suhu */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium block">Temperature (°C)</label>
                            <input
                                type="number"
                                min="0" max="100" step="0.1"
                                value={inputs.suhu}
                                onChange={(e) => handleInput('suhu', e.target.value)}
                                className={clsx(
                                    "w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all",
                                    isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                                )}
                            />
                        </div>

                        {/* 2. Kelembapan */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium block">Moisture (%)</label>
                            <input
                                type="number"
                                min="0" max="100" step="0.1"
                                value={inputs.kelembapan}
                                onChange={(e) => handleInput('kelembapan', e.target.value)}
                                className={clsx(
                                    "w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all",
                                    isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                                )}
                            />
                        </div>

                        {/* 3. pH */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium block">Acidity (pH)</label>
                            <input
                                type="number"
                                min="0" max="14" step="0.1"
                                value={inputs.ph}
                                onChange={(e) => handleInput('ph', e.target.value)}
                                className={clsx(
                                    "w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all",
                                    isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                                )}
                            />
                        </div>

                        {/* 4. Bau (Simulasi Sensor Gas) */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Wind size={16} />
                                Indikator Bau (Simulasi Ammonia)
                            </label>
                            <select
                                value={inputs.bau}
                                onChange={(e) => handleInput('bau', e.target.value)}
                                className={clsx(
                                    "w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all cursor-pointer",
                                    isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                                )}
                            >
                                {/* VALUE DI SINI DISESUAIKAN DENGAN RANGE TRAPMF/TRIMF DI JS */}
                                <option value="5">1. Tidak Bau (5 PPM) - Aman</option>
                                <option value="30">2. Cukup Bau (30 PPM) - Peringatan</option>
                                <option value="70">3. Bau Busuk (70 PPM) - Bahaya</option>
                            </select>
                        </div>

                        <button type="submit"
                            disabled={loading}
                            className="w-full py-3 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transform hover:scale-105 hover:shadow-emerald-500/40 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
                            <Sparkles className="w-5 h-5" />
                            {loading ? "Menghitung..." : "Analisis Kualitas"}
                        </button>
                    </form>
                </div>

                {/* --- RESULT CARD --- */}
                <div className={clsx(
                    "rounded-3xl p-8 shadow-xl border transition-all relative overflow-hidden h-full flex flex-col items-center justify-center text-center",
                    isDark ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"
                )}>
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    {loading && (
                        <div className="flex flex-col items-center animate-in fade-in duration-300">
                            <div className="relative w-20 h-20 mb-4">
                                <div className="absolute inset-0 rounded-full border-4 border-slate-700/20"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin"></div>
                            </div>
                            <p className="text-slate-400 animate-pulse">Running Fuzzy Inference...</p>
                        </div>
                    )}

                    {!loading && !result && (
                        <div className="flex flex-col items-center opacity-60">
                            <div className="w-20 h-20 rounded-full bg-slate-500/10 flex items-center justify-center mb-4 text-4xl">
                                🔮
                            </div>
                            <h4 className="text-lg font-medium">Siap Menganalisis</h4>
                            <p className="text-sm opacity-70">
                                Masukkan parameter di kiri dan klik tombol Analisis
                            </p>
                        </div>
                    )}

                    {!loading && result && (
                        <div className="space-y-8 w-full animate-in zoom-in duration-500">
                            {/* Score Circle */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4">Quality Score</h3>
                                <div className="relative inline-flex items-center justify-center">
                                    <svg className="w-48 h-48 transform -rotate-90">
                                        <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent"
                                            className={isDark ? "text-slate-800" : "text-slate-100"} />
                                        <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent"
                                            strokeDasharray="553"
                                            strokeDashoffset={553 - (553 * result.score / 100)}
                                            strokeLinecap="round"
                                            className={clsx("transition-all duration-1000 ease-out", resultColor)} />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className={clsx("text-5xl font-bold", isDark ? "text-white" : "text-slate-800")}>
                                            {Math.round(result.score)}
                                        </span>
                                        <span className="text-sm opacity-50">/ 100</span>
                                    </div>
                                </div>
                            </div>

                            {/* Label Result */}
                            <div className={clsx(
                                "rounded-2xl p-6 border",
                                isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-slate-50 border-slate-200"
                            )}>
                                <h4 className={clsx("text-3xl font-bold mb-1", resultColor)}>{result.label}</h4>
                                <p className="text-sm opacity-60">
                                    Hasil kalkulasi Fuzzy Logic (Mamdani)
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
