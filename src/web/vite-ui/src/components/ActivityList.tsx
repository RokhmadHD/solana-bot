import type { SnipeResult } from "../types";

type Props = {
  activity: SnipeResult[];
};

export default function ActivityList({ activity }: Props) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
      <div className="max-h-80 overflow-y-auto space-y-2">
        {activity.length === 0 && <p className="text-gray-400 text-sm text-center">No recent activity</p>}
        {activity.map((a, i) => (
          <div key={i} className="text-sm flex justify-between border-b border-gray-700 pb-1">
            <span className="truncate">{a.tokenMint.toString()}</span>
            <span className={a.success ? "text-green-400" : "text-red-400"}>
              {a.success ? "Success" : "Fail"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
