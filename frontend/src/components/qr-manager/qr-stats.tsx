interface QrStatsProps {
  active: number;
  generated: number;
  archived: number;
}

export function QrStats({ active, generated, archived }: QrStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
        <p className="text-2xl font-bold text-indigo-600">{active}</p>
        <p className="text-xs text-gray-500 mt-1">Active</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
        <p className="text-2xl font-bold text-gray-900">{generated}</p>
        <p className="text-xs text-gray-500 mt-1">Generated</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
        <p className="text-2xl font-bold text-gray-400">{archived}</p>
        <p className="text-xs text-gray-500 mt-1">Archived</p>
      </div>
    </div>
  );
}
