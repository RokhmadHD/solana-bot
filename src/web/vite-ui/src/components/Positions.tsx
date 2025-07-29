import type { Position } from "../types";

type Props = {
  positions: Position[];
};

export default function Positions({ positions }: Props) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h2 className="text-lg font-semibold mb-4">Active Positions</h2>
      <div className="max-h-80 overflow-y-auto space-y-2">
        {positions.length === 0 && <p className="text-gray-400 text-sm text-center">No active positions</p>}
        {positions.map((p, i) => (
          <div key={i} className="text-sm flex justify-between border-b border-gray-700 pb-1">
            <span className="truncate">{p.tokenMint.toString()}</span>
            <span>{(p.profitLossPercent ?? 0).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
