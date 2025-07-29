export default function ConfigPanel() {
  // Data bisa kamu fetch dari `/api/config`
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h2 className="text-lg font-semibold mb-4">Bot Configuration</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-300">
        <Field label="Max Buy Amount" value="0.1 SOL" />
        <Field label="Min Liquidity" value="10 SOL" />
        <Field label="Max Slippage" value="1.0%" />
        <Field label="Take Profit" value="15%" />
        <Field label="Stop Loss" value="10%" />
        <Field label="Auto Sell" value="true" />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-400">{label}</p>
      <p>{value}</p>
    </div>
  );
}
