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
