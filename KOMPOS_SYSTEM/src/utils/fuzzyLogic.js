// File: src/utils/fuzzyLogic.js

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
const fuzzify = (suhu, mois, ph, bau) => {
    const s = parseFloat(suhu);
    const m = parseFloat(mois);
    const p = parseFloat(ph);
    const b = parseFloat(bau);

    return {
        // Suhu
        suhu_dingin: trapmf(s, [0, 0, 28, 35]),
        suhu_ideal:  trimf(s, [30, 45, 55]),
        suhu_panas:  trapmf(s, [50, 60, 80, 80]),

        // Moisture
        mois_kering: trapmf(m, [0, 0, 30, 40]),
        mois_sedang: trimf(m, [40, 46, 52]),
        mois_basah:  trapmf(m, [50, 60, 100, 100]),

        // pH
        ph_asam:   trapmf(p, [0, 0, 5, 6]),
        ph_netral: trimf(p, [5.0, 7.0, 9.0]),
        ph_basa:   trapmf(p, [8, 9, 14, 14]),

        // Bau (Ammonia PPM)
        bau_tidak:  trapmf(b, [0, 0, 10, 20]),
        bau_cukup:  trimf(b, [15, 30, 45]),
        bau_busuk:  trapmf(b, [40, 60, 100, 100]),
    };
};

// --- 3. RULE EVALUATION (81 Rules) ---
const evaluateRules = (mu) => {
    let agg = { buruk: 0.0, sedang: 0.0, baik: 0.0, sangat_baik: 0.0 };

    const setsSuhu = ["suhu_dingin", "suhu_ideal", "suhu_panas"];
    const setsMois = ["mois_kering", "mois_sedang", "mois_basah"];
    const setsPh   = ["ph_asam", "ph_netral", "ph_basa"];
    const setsBau  = ["bau_tidak", "bau_cukup", "bau_busuk"];

    setsBau.forEach(b => {
        setsSuhu.forEach(s => {
            setsPh.forEach(p => {
                setsMois.forEach(m => {
                    const strength = Math.min(mu[b], mu[s], mu[p], mu[m]);
                    
                    if (strength > 0) {
                        let output = "buruk"; 

                        // LOGIKA OUTPUT
                        if (b === "bau_busuk") {
                            output = "buruk";
                        } else if (b === "bau_cukup") {
                            if (s === "suhu_ideal" && p === "ph_netral" && m !== "mois_basah") {
                                output = "sedang";
                            } else {
                                output = "buruk";
                            }
                        } else {
                            if (s === "suhu_ideal" && p === "ph_netral" && m === "mois_sedang") output = "sangat_baik";
                            else if (s === "suhu_ideal" && p === "ph_netral") output = "baik";
                            else if (s === "suhu_ideal" && m === "mois_sedang") output = "baik";
                            else if (p === "ph_netral" && m === "mois_sedang") output = "baik";
                            else if (s !== "suhu_ideal" && p !== "ph_netral") output = "buruk"; 
                            else output = "sedang"; 
                        }
                        agg[output] = Math.max(agg[output], strength);
                    }
                });
            });
        });
    });
    return agg;
};

// --- 4. DEFUZZIFICATION ---
const defuzzify = (agg) => {
    let numerator = 0.0;
    let denominator = 0.0;

    for (let x = 0; x <= 100; x += 2) {
        const muBuruk  = trapmf(x, [0, 0, 30, 50]);
        const muSedang = trimf(x, [40, 60, 80]);
        const muBaik   = trimf(x, [70, 85, 95]);
        const muSB     = trapmf(x, [90, 95, 100, 100]);

        const valBuruk  = Math.min(agg.buruk, muBuruk);
        const valSedang = Math.min(agg.sedang, muSedang);
        const valBaik   = Math.min(agg.baik, muBaik);
        const valSB     = Math.min(agg.sangat_baik, muSB);

        const finalMu = Math.max(valBuruk, valSedang, valBaik, valSB);

        numerator += x * finalMu;
        denominator += finalMu;
    }

    if (denominator === 0) return 0;
    return numerator / denominator;
};

// --- MAIN EXPORT ---
export const calculateFuzzy = (suhu, kelembapan, ph, bau) => {
    const mu = fuzzify(suhu, kelembapan, ph, bau);
    const agg = evaluateRules(mu);
    const score = defuzzify(agg);

    let label = "BURUK";
    if (score > 45) label = "SEDANG";
    if (score > 75) label = "BAIK";
    if (score > 90) label = "SANGAT BAIK";

    return { score, label };
};
