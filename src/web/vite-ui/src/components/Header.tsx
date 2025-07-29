import React from 'react';
import { ShieldCheck, ShieldOff, Zap } from 'lucide-react';

interface HeaderProps {
  status: string;
}

const Header: React.FC<HeaderProps> = ({ status }) => (
  <header className="bg-gray-900 text-white p-4 flex justify-between items-center border-b border-gray-700">
    <h1 className="text-xl font-bold flex items-center">
      <Zap className="mr-2 text-purple-400" />
      Solana Sniper Bot
    </h1>
    <div className="flex items-center">
      <span className={`text-sm font-medium mr-2 ${status === 'Connected' ? 'text-green-400' : 'text-red-400'}`}>
        {status}
      </span>
      {status === 'Connected' ? <ShieldCheck className="text-green-400" /> : <ShieldOff className="text-red-400" />}
    </div>
  </header>
);

export default Header;