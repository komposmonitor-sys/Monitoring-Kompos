import json
import time
import paho.mqtt.client as mqtt
import firebase_admin
from firebase_admin import credentials, db
import joblib
import pandas as pd
import numpy as np
import os

# ==========================================
# 0. FUZZY LOGIC ENGINE (Integrated)
# ==========================================
def trapmf(x, params):
    """Trapezoidal Membership Function"""
    a, b, c, d = params
    if x <= a or x >= d: return 0.0
    if a < x < b: return (x - a) / (b - a)
    if c < x < d: return (d - x) / (d - c)
    return 1.0

def trimf(x, params):
    """Triangular Membership Function"""
    a, b, c = params
    if x <= a or x >= c: return 0.0
    if a < x <= b: return (x - a) / (b - a)
    if b < x < c: return (c - x) / (c - b)
    return 0.0

def hitung_membership(suhu, moisture, ph, ammonia, bau_val):
    """Menghitung derajat keanggotaan (Fuzzification)."""
    mu = {}

    # --- SUHU ---
    mu['suhu_dingin'] = trapmf(suhu, [0, 0, 28, 35]) 
    mu['suhu_ideal']  = trimf(suhu, [30, 45, 55])
    mu['suhu_panas']  = trapmf(suhu, [50, 60, 80, 80])

    # --- KELEMBAPAN (MOISTURE) ---
    mu['kelembapan_kering'] = trapmf(moisture, [0, 0, 30, 40])
    mu['kelembapan_sedang'] = trimf(moisture, [40, 46, 52]) 
    mu['kelembapan_basah']  = trapmf(moisture, [50, 60, 100, 100])

    # --- PH ---
    mu['ph_asam']   = trapmf(ph, [0, 0, 5, 6])
    mu['ph_netral'] = trimf(ph, [5.0, 7.0, 9.0])
    mu['ph_basa']   = trapmf(ph, [8, 9, 14, 14])

    # --- VARIABEL SAFETY (AMMONIA & BAU) ---
    mu['ammo_tinggi']   = trapmf(ammonia, [25, 30, 50, 50])
    mu['bau_menyengat'] = trapmf(bau_val, [6, 8, 10, 10])

    return mu

def evaluasi_rules(mu, rules_json):
    """Inference Engine berdasarkan JSON"""
    aggregated = {'buruk': 0.0, 'sedang': 0.0, 'baik': 0.0, 'sangat_baik': 0.0}

    # 1. Safety Override
    bad_factor = max(mu['ammo_tinggi'], mu['bau_menyengat'])
    if bad_factor > 0:
        aggregated['buruk'] = bad_factor

    # 2. Iterasi Rules
    for rule in rules_json:
        c_ph = "ph_" + rule['if']['ph'].lower()
        c_suhu = "suhu_" + rule['if']['suhu'].lower()
        c_mois = "kelembapan_" + rule['if']['kelembapan'].lower()
        
        target = rule['then'].lower().replace(" ", "_")

        val_ph = mu.get(c_ph, 0)
        val_suhu = mu.get(c_suhu, 0)
        val_mois = mu.get(c_mois, 0)
        
        strength = min(val_ph, val_suhu, val_mois)

        if target in aggregated:
            aggregated[target] = max(aggregated[target], strength)

    return aggregated

def defuzzifikasi(aggregated):
    """Menghitung Crisp Output (Score 0-100)"""
    numerator = 0.0
    denominator = 0.0
    
    for x in range(101):
        mu_buruk  = trapmf(x, [0, 0, 30, 50])
        mu_sedang = trimf(x, [40, 60, 80])
        mu_baik   = trimf(x, [70, 85, 95])
        mu_sb     = trapmf(x, [90, 95, 100, 100])
        
        res_buruk  = min(aggregated['buruk'], mu_buruk)
        res_sedang = min(aggregated['sedang'], mu_sedang)
        res_baik   = min(aggregated['baik'], mu_baik)
        res_sb     = min(aggregated['sangat_baik'], mu_sb)
        
        final_mu = max(res_buruk, res_sedang, res_baik, res_sb)
        
        numerator += x * final_mu
        denominator += final_mu

    if denominator == 0: return 0
    return numerator / denominator

# ==========================================
# 1. KONFIGURASI DAN LOAD MODEL
# ==========================================
print("⏳ Memuat paket model & konfigurasi...")

# Load Fuzzy Config
FUZZY_RULES = []
try:
    with open('kompos_config.json', 'r') as f:
        config_data = json.load(f)
        FUZZY_RULES = config_data['rules']
    print("✅ Fuzzy config loaded.")
except Exception as e:
    print(f"⚠️ Warning: Gagal load kompos_config.json ({e}). Fuzzy logic mungkin tidak akurat.")

# Load ML Models
model_path = 'prediksi.pkl'
if not os.path.exists(model_path):
    print(f"❌ Error: File model '{model_path}' tidak ditemukan!")
    exit()
