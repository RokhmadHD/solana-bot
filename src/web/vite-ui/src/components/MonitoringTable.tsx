import React from 'react';
import type { TokenData } from '../types';

interface MonitoringTableProps {
  data: TokenData[];
}

const MonitoringTable: React.FC<MonitoringTableProps> = ({ data }) => (
  <div className="bg-gray-800 p-4 rounded-lg shadow-lg mt-4">
    <h2 className="text-lg font-semibold mb-4 text-white">Token yang Dipantau</h2>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-300">
        <thead className="text-xs text-gray-400 uppercase bg-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3">Token</th>
            <th scope="col" className="px-6 py-3">Harga</th>
            <th scope="col" className="px-6 py-3">Perubahan 24 Jam</th>
            <th scope="col" className="px-6 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((token) => (
            <tr key={token.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700">
              <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">{token.name} ({token.symbol})</th>
              <td className="px-6 py-4">${token.price.toFixed(4)}</td>
              <td className={`px-6 py-4 ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {token.change24h.toFixed(2)}%
              </td>
              <td className="px-6 py-4">
                <span className="bg-blue-900 text-blue-300 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">{token.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default MonitoringTable;