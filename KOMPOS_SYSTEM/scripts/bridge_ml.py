import json
import time
import os
import paho.mqtt.client as mqtt
import firebase_admin
from firebase_admin import credentials, db
import joblib
import pandas as pd
import numpy as np

# ==========================================
# 0. FUZZY LOGIC ENGINE (CORE)
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

def hitung_membership(suhu, moisture, ph, ammonia_val):
    """
    Menghitung derajat keanggotaan. 
    Input 'ammonia_val' digunakan untuk merepresentasikan variabel 'Bau'.
    """
    mu = {}

    # --- 1. SUHU (Derajat Celcius) ---
    mu['suhu_dingin'] = trapmf(suhu, [0, 0, 28, 35]) 
    mu['suhu_ideal']  = trimf(suhu, [30, 45, 55])
    mu['suhu_panas']  = trapmf(suhu, [50, 60, 80, 80])

    # --- 2. KELEMBAPAN/MOISTURE (%) ---
    mu['kelembapan_kering'] = trapmf(moisture, [0, 0, 30, 40])
    mu['kelembapan_sedang'] = trimf(moisture, [40, 46, 52]) 
    mu['kelembapan_basah']  = trapmf(moisture, [50, 60, 100, 100])

    # --- 3. PH (0-14) ---
    mu['ph_asam']   = trapmf(ph, [0, 0, 5, 6])
    mu['ph_netral'] = trimf(ph, [5.0, 7.0, 9.0])
    mu['ph_basa']   = trapmf(ph, [8, 9, 14, 14])

    # --- 4. BAU (Menggunakan Nilai Ammonia PPM) ---
    # Asumsi: <15 PPM (Tidak Bau), 15-45 (Cukup), >40 (Busuk)
    mu['bau_tidak_bau'] = trapmf(ammonia_val, [0, 0, 10, 20])
    mu['bau_cukup_bau'] = trimf(ammonia_val, [15, 30, 45])
    mu['bau_bau_busuk'] = trapmf(ammonia_val, [40, 60, 100, 100])

    return mu

def evaluasi_rules(mu, rules_json):
    """Inference Engine 4 Variabel"""
    aggregated = {'buruk': 0.0, 'sedang': 0.0, 'baik': 0.0, 'sangat_baik': 0.0}

    for rule in rules_json:
        try:
            # Konstruksi Key Dictionary (Lowercase & Replace Spasi dengan Underscore)
            c_ph   = "ph_" + rule['if']['ph'].lower().replace(" ", "_")
            c_suhu = "suhu_" + rule['if']['suhu'].lower().replace(" ", "_")
            c_mois = "kelembapan_" + rule['if']['kelembapan'].lower().replace(" ", "_")
            c_bau  = "bau_" + rule['if']['bau'].lower().replace(" ", "_") 
            
            target = rule['then'].lower().replace(" ", "_") 

            # Ambil nilai fuzzy (jika key tidak ada, return 0.0)
            val_ph   = mu.get(c_ph, 0.0)
            val_suhu = mu.get(c_suhu, 0.0)
            val_mois = mu.get(c_mois, 0.0)
            val_bau  = mu.get(c_bau, 0.0) 
            
            # Operasi AND (Min)
            strength = min(val_ph, val_suhu, val_mois, val_bau)

            # Operasi OR (Max) ke Agregasi
            if target in aggregated:
                aggregated[target] = max(aggregated[target], strength)
        except KeyError as e:
            print(f"⚠️ Rule Error: Key {e} tidak ditemukan di membership function.")
            continue

    return aggregated

def defuzzifikasi(aggregated):
    """Metode Centroid"""
    numerator = 0.0
    denominator = 0.0

    # Menggunakan step 2 untuk sedikit mempercepat loop tanpa mengurangi akurasi drastis
    for x in range(0, 101, 2):
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
# 1. SETUP & LOAD RESOURCES
# ==========================================
print("\n[INIT] ⏳ Memuat konfigurasi sistem...")

# A. Load Rules JSON
FUZZY_RULES = []
try:
    with open('kompos_config.json', 'r') as f:
        config_data = json.load(f)
        FUZZY_RULES = config_data['rules']
    print(f"✅ Rules Loaded: {len(FUZZY_RULES)} aturan ditemukan.")
except Exception as e:
    print(f"⚠️ Warning: Gagal load kompos_config.json ({e}).")

# B. Load ML Models
model_path = 'prediksi.pkl'
model_ammonia = None
model_maturity = None

if os.path.exists(model_path):
    try:
        loaded_object = joblib.load(model_path)
        # Handling struktur pickle yang berbeda-beda
        if isinstance(loaded_object, dict):
            model_ammonia = loaded_object.get('rf_regressor_ammonia') or loaded_object.get('lgbm_ammonia')
            model_maturity = loaded_object.get('rf_classifier_maturity')
        else:
            model_ammonia = loaded_object # Asumsi file cuma isi model ammonia
            
        if model_ammonia: print("✅ Model ML Ammonia Siap.")
        else: print("❌ Model Ammonia tidak ditemukan dalam PKL.")
    except Exception as e:
        print(f"❌ Error Loading Model: {e}")
else:
    print(f"❌ File '{model_path}' tidak ditemukan!")

# C. Firebase Setup
cred_path = 'komposproject-dfe5e-firebase-adminsdk-fbsvc-235f1caa0c.json'
if os.path.exists(cred_path):
    try:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://komposproject-dfe5e-default-rtdb.asia-southeast1.firebasedatabase.app'
        })
        ref_logs = db.reference('sensor_logs') 
        ref_now = db.reference('sensor_now')
        print("✅ Firebase Connected.")
    except Exception as e:
        print(f"❌ Firebase Error: {e}")
        exit()
else:
    print("❌ File Credential Firebase tidak ditemukan!")
    exit()

# ==========================================
# 2. MQTT & CONTROL LOGIC
# ==========================================
MQTT_BROKER = "broker.hivemq.com"
MQTT_TOPIC = "talha/sensor"
MQTT_CONTROL_TOPIC = "talha/control"

def control_listener(event):
    """Callback real-time saat user mengubah tombol di App"""
    if not event.data: return
    print(f"\n🔔 [FIREBASE] Perubahan Control Terdeteksi")
    
    try:
        # Ambil state terbaru dari path 'controls'
        full_state = db.reference('controls').get()
        if not full_state: return

        pump_status = 1 if full_state.get('pump') == 1 else 0
        aerator_status = 1 if full_state.get('aerator') == 1 else 0

        # Kirim command ke ESP32
        payload = json.dumps({
            "pump": pump_status,
            "aerator": aerator_status,
            "auto": 0  # Override ke Manual saat dikontrol via App
        })
        
        client.publish(MQTT_CONTROL_TOPIC, payload)
        print(f"📤 [MQTT] Mengirim Control: {payload}")

    except Exception as e:
        print(f"⚠️ Control Listener Error: {e}")

# Pasang listener Firebase di background
try:
    db.reference('controls').listen(control_listener)
except Exception as e:
    print(f"⚠️ Gagal attach listener: {e}")

# ==========================================
# 3. MAIN MQTT LOOP (DATA PROCESSING)
# ==========================================

def on_connect(client, userdata, flags, rc, properties=None):
    print(f"\n✅ Terhubung ke MQTT Broker (RC: {rc})")
    client.subscribe(MQTT_TOPIC)
    print("🚀 Sistem Monitoring Aktif. Menunggu data...")

def on_message(client, userdata, msg):
    payload = msg.payload.decode()
    try:
        data_json = json.loads(payload)
        
        # 1. Parse Data Sensor
        suhu = float(data_json.get('suhu', 0))
        moisture = float(data_json.get('moisture', 0))
        ph = float(data_json.get('ph', 7))
        
        print(f"\n📥 [DATA MASUK] T={suhu}°C | M={moisture}% | pH={ph}")

        # 2. ML Prediction (Ammonia)
        pred_ammonia = 0.0
        if model_ammonia:
            # Bentuk dataframe sesuai training model
            input_df = pd.DataFrame([[suhu, moisture, ph]], columns=['Temperature', 'MC(%)', 'pH'])
            pred_raw = model_ammonia.predict(input_df)[0]
            pred_ammonia = max(0.0, float(pred_raw)) # Hindari minus
            
            # Normalisasi sederhana jika model menghasilkan nilai sangat besar
            # Hapus baris di bawah jika model Anda sudah output PPM yang benar
            # pred_ammonia = pred_ammonia / 40.0 
            
            print(f"   └── [ML] Estimasi Ammonia: {pred_ammonia:.2f} PPM")

        # 3. ML Prediction (Maturity)
        pred_maturity = "Unknown"
        if model_maturity:
            try:
                input_mat = pd.DataFrame([[suhu, moisture, ph, pred_ammonia]], 
                                       columns=['Temperature', 'MC(%)', 'pH', 'Ammonia(mg/kg)'])
                res = model_maturity.predict(input_mat)[0]
                pred_maturity = "Matang" if res == 1 else "Belum Matang"
                print(f"   └── [ML] Maturity: {pred_maturity}")
            except: pass

        # 4. Fuzzy Logic Inference
        # Gunakan 'pred_ammonia' sebagai input ke variabel 'bau'
        mu_vals = hitung_membership(suhu, moisture, ph, pred_ammonia)
        agg_res = evaluasi_rules(mu_vals, FUZZY_RULES)
        fuzzy_score = defuzzifikasi(agg_res)

        # Labeling Score
        if fuzzy_score <= 45: fuzzy_label = "BURUK"
        elif fuzzy_score <= 75: fuzzy_label = "SEDANG"
        elif fuzzy_score <= 90: fuzzy_label = "BAIK"
        else: fuzzy_label = "SANGAT BAIK"

        print(f"   └── [FUZZY] Score: {fuzzy_score:.2f} ({fuzzy_label})")

        # 5. Save to Firebase
        save_data = {
            'suhu': suhu,
            'moisture': moisture,
            'ph': ph,
            'ammonia': round(pred_ammonia, 2),
            'score': round(fuzzy_score, 2),
            'fuzzy_label': fuzzy_label,
            'maturity': pred_maturity,
            'timestamp': int(time.time() * 1000) # Epoch ms
        }
        
        ref_logs.push(save_data) # Simpan history
        ref_now.set(save_data)   # Update realtime view
        print("   └── [DB] Data tersimpan ke Firebase.")

    except json.JSONDecodeError:
        print("⚠️ Error: Payload bukan JSON valid.")
    except Exception as e:
        print(f"⚠️ Error Processing: {e}")

# ==========================================
# 4. EXECUTION START
# ==========================================
# Setup Client dengan Callback API V2 (untuk support library baru & lama)
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2) 
client.on_connect = on_connect
client.on_message = on_message

print(f"📡 Connecting to {MQTT_BROKER}...")
try:
    client.connect(MQTT_BROKER, 1883, 60)
    client.loop_forever()
except KeyboardInterrupt:
    print("\n🛑 Program dihentikan user.")
except Exception as e:
    print(f"\n❌ Gagal koneksi MQTT: {e}")
