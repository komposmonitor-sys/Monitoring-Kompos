// File: src/utils/fuzzyLogic.js
import config from './kompos_config.json'; // Pastikan file JSON ada di folder yang sama

// --- 1. MEMBERSHIP FUNCTIONS ---
const trapmf = (x, [a, b, c, d]) => {
    if (x <= a || x >= d) return 0.0;
    if (x > a && x < b) return (x - a) / (b - a);
    if (x >= b && x <= c) return 1.0;
    if (x > c && x < d) return (d - x) / (d - c);
    return 1.0;
};

const trimf = (x, [a, b, c]) => {
    if (x <= a || x >= c) return 0.0;
    if (x > a && x <= b) return (x - a) / (b - a);
    if (x > b && x < c) return (c - x) / (c - b);
    return 0.0;
};

// --- 2. FUZZIFICATION ---
// Kunci di sini harus match dengan cara kita memproses JSON nanti
const fuzzify = (suhu, mois, ph, bau) => {
    const s = parseFloat(suhu);
    const m = parseFloat(mois);
    const p = parseFloat(ph);
    const b = parseFloat(bau);

    return {
        // SUHU
        suhu_dingin: trapmf(s, [0, 0, 28, 35]),
        suhu_ideal:  trimf(s, [30, 45, 55]),
        suhu_panas:  trapmf(s, [50, 60, 80, 80]),

        // KELEMBAPAN
        kelembapan_kering: trapmf(m, [0, 0, 30, 40]),
        kelembapan_sedang: trimf(m, [40, 46, 52]),
        kelembapan_basah:  trapmf(m, [50, 60, 100, 100]),

        // PH
        ph_asam:   trapmf(p, [0, 0, 5, 6]),
        ph_netral: trimf(p, [5.0, 7.0, 9.0]),
        ph_basa:   trapmf(p, [8, 9, 14, 14]),

        // BAU (Ammonia)
        // Penamaan key disesuaikan agar cocok dengan mapper JSON
        bau_tidak_bau: trapmf(b, [0, 0, 10, 20]),
        bau_cukup_bau: trimf(b, [15, 30, 45]),
        bau_bau_busuk: trapmf(b, [40, 60, 100, 100]),
    };
};

// --- 3. RULE EVALUATION (Based on JSON) ---
const evaluateRules = (mu) => {
    let agg = { buruk: 0.0, sedang: 0.0, baik: 0.0, sangat_baik: 0.0 };
    
    // Loop langsung ke data Rules dari JSON (81 Rules)
    config.rules.forEach(rule => {
        try {
            // 1. Konstruksi Key agar cocok dengan output Fuzzify
            // Contoh: "suhu" + "_" + "Ideal" -> "suhu_ideal"
            const k_suhu = `suhu_${rule.if.suhu.toLowerCase().replace(" ", "_")}`;
            const k_ph   = `ph_${rule.if.ph.toLowerCase().replace(" ", "_")}`;
            const k_mois = `kelembapan_${rule.if.kelembapan.toLowerCase().replace(" ", "_")}`;
            const k_bau  = `bau_${rule.if.bau.toLowerCase().replace(" ", "_")}`;

            // 2. Ambil derajat keanggotaan
            const val_suhu = mu[k_suhu] || 0;
            const val_ph   = mu[k_ph] || 0;
            const val_mois = mu[k_mois] || 0;
            const val_bau  = mu[k_bau] || 0;

            // 3. Operasi AND (Min)
            const strength = Math.min(val_suhu, val_ph, val_mois, val_bau);

            // 4. Operasi OR (Max) ke Output Target
            const target = rule.then.toLowerCase().replace(" ", "_"); // "Sangat Baik" -> "sangat_baik"
            
            if (agg[target] !== undefined) {
                agg[target] = Math.max(agg[target], strength);
            }

        } catch (err) {
            console.warn("Rule Error:", err);
        }
    });

    return agg;
};

// --- 4. DEFUZZIFICATION (Centroid) ---
const defuzzify = (agg) => {
    let numerator = 0.0;
    let denominator = 0.0;

    // Sampling titik 0-100
    for (let x = 0; x <= 100; x += 2) {
        // Output Membership Functions
        // (Pastikan parameter ini SAMA PERSIS dengan Python Anda)
        const muBuruk  = trapmf(x, [0, 0, 30, 50]);
        const muSedang = trimf(x, [40, 60, 80]);
        const muBaik   = trimf(x, [70, 85, 95]);
        const muSB     = trapmf(x, [90, 95, 100, 100]);

        // Potong grafik (Clipping - Operasi Min)
        const valBuruk  = Math.min(agg.buruk, muBuruk);
        const valSedang = Math.min(agg.sedang, muSedang);
        const valBaik   = Math.min(agg.baik, muBaik);
        const valSB     = Math.min(agg.sangat_baik, muSB);

        // Gabung grafik (Union - Operasi Max)
        const finalMu = Math.max(valBuruk, valSedang, valBaik, valSB);

        numerator += x * finalMu;
        denominator += finalMu;
    }

    // --- PERBAIKAN PENTING (SAFETY NET) ---
    // Karena kita pakai 16 Rules (bukan 81), ada kemungkinan tidak ada rule yang cocok.
    // Jika denominator 0, jangan return 0 (Buruk), tapi return 40 (Nilai Aman).
    if (denominator === 0) {
        console.warn("⚠️ Peringatan: Input masuk ke celah rule (Blindspot). Menggunakan skor default.");
        return 40.0; 
    }

    return numerator / denominator;
};
// --- MAIN EXPORT ---
export const calculateFuzzy = (suhu, kelembapan, ph, bau) => {
    const mu = fuzzify(suhu, kelembapan, ph, bau);
    const agg = evaluateRules(mu);
    
    //  - Visual representation of how the score is calculated
    const score = defuzzify(agg);

    let label = "BURUK";
    if (score > 45) label = "SEDANG";
    if (score > 75) label = "BAIK";
    if (score > 90) label = "SANGAT BAIK";

    return { score, label };
};
