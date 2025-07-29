import React, { useState, useEffect } from 'react';
import { io, Socket } from "socket.io-client";
import type { TokenData, ActivityLogEntry, ChartDataPoint } from './types';

// Impor komponen
import Header from './components/Header';
import MonitoringTable from './components/MonitoringTable';
import TokenChart from './components/TokenChart';
// Impor komponen lain yang Anda buat seperti SnipeControlPanel dan ActivityLog

const App: React.FC = () => {
  const [status, setStatus] = useState<string>("Disconnected");
  const [monitoringData, setMonitoringData] = useState<TokenData[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    // Menetapkan tipe untuk socket
    const socket: Socket = io("http://localhost:3000");

    socket.on("connect", () => setStatus("Connected"));
    socket.on("disconnect", () => setStatus("Disconnected"));

    // Menetapkan tipe untuk 'data' yang diterima dari socket
    socket.on("monitoringData", (data: TokenData) => {
      
      // Update tabel monitoring
      setMonitoringData(prevData => {
        // Cek jika token sudah ada, update. Jika tidak, tambahkan.
        const existingIndex = prevData.findIndex(t => t.id === data.id);
        if (existingIndex > -1) {
          const newData = [...prevData];
          newData[existingIndex] = data;
          return newData;
        }
        return [...prevData, data];
      });

      // Update data grafik
      const newChartPoint: ChartDataPoint = {
        time: new Date().toLocaleTimeString(),
        price: data.price,
      };

      // Menjaga agar data grafik tidak terlalu banyak (misal, 30 titik data terakhir)
      setChartData(prevChartData => [...prevChartData.slice(-29), newChartPoint]);
    });

    // Simulasi data masuk dari backend untuk tujuan pengembangan
    const interval = setInterval(() => {
        const dummyPrice = 140 + Math.random() * 10;
        const dummyData: TokenData = {
            id: 'solana-main',
            name: 'Solana',
            symbol: 'SOL',
            price: dummyPrice,
            change24h: (Math.random() - 0.5) * 10,
            marketCap: 65000000000,
            status: 'Monitoring'
        };
        // Emit data dummy seolah-olah dari server (untuk testing UI)
        socket.emit("monitoringData", dummyData); 
    }, 3000);

    // Cleanup saat komponen unmount
    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []); // Dependensi kosong agar useEffect hanya berjalan sekali

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <Header status={status} />
      <main className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            {/* <SnipeControlPanel /> */}
            <MonitoringTable data={monitoringData} />
          </div>
          <div className="space-y-4">
             <TokenChart data={chartData} />
             {/* <ActivityLog logs={activityLogs} /> */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;