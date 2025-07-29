import type { MonitoringData } from "../types";

type Props = {
  data: MonitoringData | null;
};

export default function Dashboard({ data }: Props) {
  const rate = data && data.totalSnipeAttempts > 0
    ? ((data.successfulSnipes / data.totalSnipeAttempts) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card title="Total Attempts" value={data?.totalSnipeAttempts ?? 0} color="blue" />
      <Card title="Success Rate" value={`${rate}%`} color="green" />
      <Card title="Total P&L" value={`${(data?.totalProfitLoss ?? 0).toFixed(2)} SOL`} color="yellow" />
    </div>
  );
}

function Card({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
      <div className={`text-${color}-500 text-2xl`}>
        <i className="fas fa-chart-line" />
      </div>
    </div>
  );
}
