import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ChartDataPoint } from '../types';

interface TokenChartProps {
    data: ChartDataPoint[];
}

const TokenChart: React.FC<TokenChartProps> = ({ data }) => (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-64">
        <h2 className="text-lg font-semibold mb-4 text-white">Grafik Harga Real-time</h2>
        <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#8884d8" />
                <YAxis stroke="#8884d8" domain={['dataMin', 'dataMax']} />
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                <Area type="monotone" dataKey="price" stroke="#8884d8" fillOpacity={1} fill="url(#colorPrice)" />
            </AreaChart>
        </ResponsiveContainer>
    </div>
);

export default TokenChart;