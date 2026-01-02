#include <WiFi.h>
#include <PubSubClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include <ArduinoJson.h>

// ==========================================
// 1. WIFI & MQTT
// ==========================================
const char* ssid = "ALAYDRUS";
const char* password = "87654321";
const char* mqtt_server = "broker.hivemq.com";
const char* mqtt_topic  = "talha/sensor";
const char* mqtt_control = "talha/control";

WiFiClient espClient;
PubSubClient client(espClient);

// ==========================================
// 2. SENSOR & PIN
// ==========================================
#define ONE_WIRE_BUS 15
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature ds18b20(&oneWire);

#define MOISTURE_PIN 32
#define PH_ADC 34
#define DMS_EN 13
#define BUZZER_PIN 27 

#define RELAY_POMPA 33   // IN1
#define RELAY_AERATOR 25 // IN2

// ==========================================
// 3. VARIABLE & STATE
// ==========================================
unsigned long lastSend = 0;
unsigned long pumpStartTime = 0;
bool isPumpActive = false;
bool manualMode = false; 

const int dryVal = 3250;
const int wetVal = 1155;
int moistureOffset = -25;
float a = -0.0074;
float b = 11.4;
float phOffset = -1.8;

// ==========================================
// 4. CALLBACK MQTT (KONTROL MANUAL)
// ==========================================
void callback(char* topic, byte* payload, unsigned int length) {
  if (String(topic) == mqtt_control) {
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, payload, length);

    int pumpState = doc["pump"] | -1;    
    int aeratorState = doc["aerator"] | -1;
    int mode = doc["auto"] | -1; 

    if (mode == 1) manualMode = false;
    if (mode == 0) manualMode = true;

    if (manualMode) {
      if (pumpState != -1) digitalWrite(RELAY_POMPA, pumpState == 1 ? LOW : HIGH);
      if (aeratorState != -1) digitalWrite(RELAY_AERATOR, aeratorState == 1 ? LOW : HIGH);
    }
  }
}

/ ==========================================
// 5. FUNGSI PENDUKUNG
// ==========================================
void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Menghubungkan ke "); Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Terhubung!");
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Mencoba koneksi MQTT...");
    String cid = "ESP32-Talha-";
    cid += String(random(0xffff), HEX);
    if (client.connect(cid.c_str())) {
      Serial.println("Terhubung!");
      client.subscribe(mqtt_control);
    } else {
      Serial.print("Gagal, rc="); Serial.print(client.state());
      delay(5000);
    }
  }
}

int readAnalogAvg(int pin, int samples = 10) {
  long sum = 0;
  for (int i = 0; i < samples; i++) { sum += analogRead(pin); delay(5); }
  return sum / samples;
}

float bacaPH() {
  long sum = 0;
  for (int i = 0; i < 20; i++) { sum += analogRead(PH_ADC); delay(5); }
  float adc = sum / 20.0;
  float ph = (a * adc) + b + phOffset;
  return constrain(ph, 5.5, 9.0);
}

// ==========================================
// 6. SETUP
// ==========================================
void setup() {
  Serial.begin(115200);
  
  // Tunggu Serial siap (penting untuk beberapa jenis ESP32)
  while(!Serial) { ; }
  Serial.println("--- SISTEM MONITORING KOMPOS DIMULAI ---");

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  pinMode(MOISTURE_PIN, INPUT);
  pinMode(PH_ADC, INPUT);
  pinMode(DMS_EN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(RELAY_POMPA, OUTPUT);
  pinMode(RELAY_AERATOR, OUTPUT);

  digitalWrite(RELAY_POMPA, HIGH); 
  digitalWrite(RELAY_AERATOR, HIGH); 

  ds18b20.begin();
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}
