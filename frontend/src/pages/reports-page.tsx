import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter,
  type PieLabelRenderProps,
} from 'recharts';
import { Leaf, Clock, Package, AlertTriangle } from 'lucide-react';
import { StatCard } from '@/components/reports/stat-card';
import { useEnhancedDashboard } from '@/hooks/use-reports';

const DONUT_COLORS: Record<string, string> = {
  HAS_CULTURE: '#22c55e',
  HAS_MEDIA: '#f59e0b',
  EMPTY: '#6b7280',
  DISCARDED: '#ef4444',
};

export default function ReportsPage() {
  const { data, isLoading } = useEnhancedDashboard();

  if (isLoading) {
    return <div className="py-8 text-center text-gray-400">Loading...</div>;
  }

  if (!data) {
    return <div className="py-8 text-center text-gray-400">No data available</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title="Active Cultures"
          value={data.activeCultures.count}
          change={data.activeCultures.change}
          icon={Leaf}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatCard
          title="Due This Week"
          value={data.dueThisWeek.count}
          change={data.dueThisWeek.change}
          icon={Clock}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
        <StatCard
          title="Total Containers"
          value={data.totalContainers.count}
          change={data.totalContainers.change}
          icon={Package}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatCard
          title="Discard Rate"
          value={`${data.discardRate.rate}%`}
          change={data.discardRate.change}
          icon={AlertTriangle}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
      </div>

      {/* Charts */}
      <div className="space-y-6">
        {/* Container Status Distribution - Donut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Container Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {data.statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.statusDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    label={(props: PieLabelRenderProps) => {
                      const name = String(props.name ?? '').replace('_', ' ');
                      const pct = Math.round((props.percent ?? 0) * 100);
                      return `${name}: ${pct}%`;
                    }}
                    labelLine
                  >
                    {data.statusDistribution.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={DONUT_COLORS[entry.status] ?? '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-gray-400">No data</p>
            )}
          </CardContent>
        </Card>

        {/* Weekly Activity - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="processed" fill="#4F46E5" name="Processed" />
                <Bar dataKey="discarded" fill="#ef4444" name="Discarded" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Upcoming Workload - Scatter Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Workload (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcomingWorkload.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis dataKey="dueCount" />
                  <Tooltip
                    formatter={(value: unknown) => [Number(value), 'Due containers']}
                    labelFormatter={(label: unknown) =>
                      new Date(String(label)).toLocaleDateString()
                    }
                  />
                  <Scatter data={data.upcomingWorkload} fill="#4F46E5" />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-gray-400">
                No upcoming workload
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
