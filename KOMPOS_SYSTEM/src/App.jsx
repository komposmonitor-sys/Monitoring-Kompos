import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, query, limitToLast, onValue } from 'firebase/database';
import { Thermometer, Droplets, FlaskConical, Wind, Award, Info } from 'lucide-react';
import Layout from './components/Layout';
import Navbar from './components/Navbar';
import DashboardHeader from './components/DashboardHeader';
import StatsCard from './components/StatsCard';
import ChartSection from './components/ChartSection';
import HistoryTable from './components/HistoryTable';
import ExpertSystem from './components/ExpertSystem';
import ActuatorControl from './components/ActuatorControl';
import clsx from 'clsx';

// ==========================================
// 1. CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyD3BiXLDv22IfcJ-w1VQlMj7Sl9JFBQnuo",
  authDomain: "komposproject-dfe5e.firebaseapp.com",
  databaseURL: "https://komposproject-dfe5e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "komposproject-dfe5e",
  storageBucket: "komposproject-dfe5e.firebasestorage.app",
  messagingSenderId: "702334195562",
  appId: "1:702334195562:web:cc7a875f559e4afa05b713",
  measurementId: "G-XYNFFN4VNP"
};

// ==========================================
// 2. INITIALIZATION
// ==========================================
let app;
let db;
try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
} catch (error) {
  console.error("Firebase Init Error:", error);
}

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function App() {
  // State
  const [currentData, setCurrentData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDark, setIsDark] = useState(true); // Default to Dark Mode for "Estetik"

  // Toggle Theme
  const toggleTheme = () => setIsDark(!isDark);

  // Effect: Fetch Data
  useEffect(() => {
    if (!db) {
      setError("Database connection failed. Please check configuration.");
      setLoading(false);
      return;
    }

    const sensorRef = ref(db, 'sensor_logs');
    const recentDataQuery = query(sensorRef, limitToLast(30));

    const unsubscribe = onValue(recentDataQuery, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const formattedData = Object.keys(data).map(key => {
          const item = data[key];
          return {
            id: key,
            ...item,
            timestamp: item.timestamp ? new Date(item.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' }) : "Just now",
            ammonia: item.ammonia !== undefined ? item.ammonia : 0,
            score: item.score !== undefined ? item.score : 0,
            maturity: item.maturity || "Pending..."
          };
        });

        const rawData = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        rawData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        const finalData = rawData.map(item => ({
          ...item,
          timestamp: item.timestamp ? new Date(item.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium' }) : "Just now",
          ammonia: item.ammonia !== undefined ? item.ammonia : 0,
          score: item.score !== undefined ? item.score : 0,
          maturity: item.maturity || "Pending..."
        }));

        setHistoryData([...finalData].reverse()); // Table: Newest first
        setCurrentData(finalData[finalData.length - 1]); // Latest
        setError(null);
      } else {
        setCurrentData(null);
        setHistoryData([]);
      }
      setLoading(false);
    }, (err) => {
      console.error("DB Error:", err);
      setError("Failed to read data. Permission denied?");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Loading State
  if (loading) {
    return (
      <div className={clsx("min-h-screen flex items-center justify-center", isDark ? "bg-slate-950" : "bg-slate-50")}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-900/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin"></div>
          </div>
          <p className={clsx("animate-pulse font-medium", isDark ? "text-emerald-500" : "text-emerald-700")}>Connecting to Database...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-600 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full text-center">
          <Info size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2">Connection Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }
