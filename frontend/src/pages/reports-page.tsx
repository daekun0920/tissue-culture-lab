import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { useEmployees } from '@/hooks/use-employees';
import { useEmployeeReport, useSystemReport } from '@/hooks/use-reports';

const COLORS = ['#22c55e', '#f59e0b', '#6b7280', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function ReportsPage() {
  const [tab, setTab] = useState('system');
  const [employeeId, setEmployeeId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data: employees } = useEmployees();
  const { data: empReport, isLoading: empLoading, isError: empError } = useEmployeeReport(employeeId, from || undefined, to || undefined);
  const { data: sysReport, isLoading: sysLoading, isError: sysError } = useSystemReport(from || undefined, to || undefined);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="system">System Reports</TabsTrigger>
          <TabsTrigger value="employee">Employee Reports</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Date range */}
      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>
        {tab === 'employee' && (
          <div className="space-y-1">
            <Label className="text-xs">Employee</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {(employees ?? []).map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* System Reports */}
      {tab === 'system' && (
        sysLoading ? <p className="text-gray-500">Loading...</p> : sysError ? <p className="text-red-500">Failed to load system report.</p> : sysReport && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Active Cultures', value: sysReport.activeCultures, color: 'text-green-700' },
                { label: 'Total Containers', value: sysReport.totalContainers, color: 'text-slate-900' },
                { label: 'Media Batches', value: sysReport.mediaBatchesUsed, color: 'text-amber-700' },
                { label: 'Discard Rate', value: `${sysReport.discardRate}%`, color: 'text-red-700' },
              ].map((m) => (
                <Card key={m.label}>
                  <CardContent className="p-5">
                    <p className="text-sm text-gray-500">{m.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${m.color}`}>{m.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <Card>
                <CardHeader><CardTitle className="text-base">Status Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={Object.entries(sysReport.statusCounts).map(([name, value]) => ({ name, value }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {Object.entries(sysReport.statusCounts).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Action Breakdown */}
              <Card>
                <CardHeader><CardTitle className="text-base">Action Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={sysReport.actionBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="action" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      )}

      {/* Employee Reports */}
      {tab === 'employee' && (
        !employeeId ? (
          <p className="text-gray-400 text-sm py-8 text-center">Select an employee to view their report.</p>
        ) : empLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : empError ? (
          <p className="text-red-500">Failed to load employee report.</p>
        ) : empReport && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Actions', value: empReport.totalActions, color: 'text-slate-900' },
                { label: 'Containers Processed', value: empReport.containersProcessed, color: 'text-blue-700' },
                { label: 'Contamination Rate', value: `${empReport.contaminationRate}%`, color: 'text-red-700' },
                { label: 'Cultures Added', value: empReport.actionBreakdown.find(a => a.action === 'ADD_CULTURE')?.count ?? 0, color: 'text-green-700' },
              ].map((m) => (
                <Card key={m.label}>
                  <CardContent className="p-5">
                    <p className="text-sm text-gray-500">{m.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${m.color}`}>{m.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Action Breakdown</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {empReport.actionBreakdown.map((ab) => (
                      <TableRow key={ab.action}>
                        <TableCell className="font-medium">{ab.action}</TableCell>
                        <TableCell>{ab.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )
      )}
    </div>
  );
}
