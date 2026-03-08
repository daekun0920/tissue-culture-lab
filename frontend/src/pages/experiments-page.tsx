import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/containers/status-badge';
import { useEmployees } from '@/hooks/use-employees';
import {
  useExperiments, useExperimentDetail, useCreateExperiment,
  useUpdateExperiment, useAddExperimentCultures, useRemoveExperimentCulture,
  useAddExperimentEntry,
} from '@/hooks/use-experiments';
import type { Experiment } from '@/types';

function ExperimentStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-gray-100 text-gray-600',
  };
  return <Badge className={`${colors[status] ?? ''} hover:${colors[status] ?? ''}`}>{status}</Badge>;
}

// List View
function ExperimentsList() {
  const navigate = useNavigate();
  const { data: experiments, isLoading } = useExperiments();
  const { data: employees } = useEmployees();
  const createMutation = useCreateExperiment();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createdBy, setCreatedBy] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createdBy) { toast.error('Select an employee'); return; }
    try {
      const exp = await createMutation.mutateAsync({ name, description: description || undefined, createdBy });
      toast.success('Experiment created');
      setDialogOpen(false);
      navigate(`/experiments/${exp.id}`);
    } catch { toast.error('Failed to create experiment'); }
  }

  if (isLoading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Experiments</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button>New Experiment</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Experiment</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Experiment name" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Created By</Label>
                <Select value={createdBy} onValueChange={setCreatedBy}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {(employees ?? []).filter(e => e.isActive).map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={createMutation.isPending}>Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!experiments?.length ? (
        <p className="py-8 text-center text-gray-400">No experiments yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {experiments.map((exp) => (
            <Link key={exp.id} to={`/experiments/${exp.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{exp.name}</h3>
                    <ExperimentStatusBadge status={exp.status} />
                  </div>
                  {exp.description && <p className="text-sm text-gray-500 mb-2 line-clamp-2">{exp.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{new Date(exp.startDate).toLocaleDateString()}</span>
                    <span>{exp._count?.cultures ?? 0} cultures</span>
                    <span>{exp._count?.entries ?? 0} entries</span>
                    <span>by {exp.creator?.name}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Detail View
function ExperimentDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const { data: experiment, isLoading } = useExperimentDetail(id);
  const { data: employees } = useEmployees();
  const updateMutation = useUpdateExperiment();
  const addCulturesMutation = useAddExperimentCultures();
  const removeCultureMutation = useRemoveExperimentCulture();
  const addEntryMutation = useAddExperimentEntry();

  const [qrInput, setQrInput] = useState('');
  const [entryContent, setEntryContent] = useState('');
  const [entryType, setEntryType] = useState('log');
  const [entryCreatedBy, setEntryCreatedBy] = useState('');

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!experiment) return <p className="text-gray-500">Experiment not found.</p>;

  async function handleAddCultures() {
    const codes = qrInput.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    if (!codes.length) return;
    try {
      await addCulturesMutation.mutateAsync({ id, data: { containerQrCodes: codes } });
      toast.success('Cultures added');
      setQrInput('');
    } catch { toast.error('Failed to add cultures'); }
  }

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!entryCreatedBy) { toast.error('Select an employee'); return; }
    try {
      await addEntryMutation.mutateAsync({
        id,
        data: { entryType, content: entryContent, createdBy: entryCreatedBy },
      });
      toast.success('Entry added');
      setEntryContent('');
    } catch { toast.error('Failed to add entry'); }
  }

  async function handleStatusChange(status: string) {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { status, ...(status !== 'active' ? { endDate: new Date().toISOString() } : {}) },
      });
      toast.success(`Experiment marked as ${status}`);
    } catch { toast.error('Failed to update'); }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/experiments')} className="mb-2">&larr; Back</Button>
          <h2 className="text-2xl font-bold text-gray-900">{experiment.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <ExperimentStatusBadge status={experiment.status} />
            <span className="text-sm text-gray-400">
              Started {new Date(experiment.startDate).toLocaleDateString()} by {experiment.creator?.name}
            </span>
          </div>
          {experiment.description && <p className="text-sm text-gray-500 mt-2">{experiment.description}</p>}
        </div>
        <div className="flex gap-2">
          {experiment.status === 'active' && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleStatusChange('completed')}>Complete</Button>
              <Button variant="outline" size="sm" onClick={() => handleStatusChange('cancelled')}>Cancel</Button>
            </>
          )}
        </div>
      </div>

      {/* Assigned Cultures */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assigned Cultures ({experiment.cultures?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="QR codes (comma-separated)"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              className="font-mono"
            />
            <Button onClick={handleAddCultures} disabled={addCulturesMutation.isPending || !qrInput.trim()}>Add</Button>
          </div>

          {experiment.cultures && experiment.cultures.length > 0 ? (
            <div className="space-y-2">
              {experiment.cultures.map((ec) => (
                <div key={ec.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <Link to={`/containers/${encodeURIComponent(ec.containerQr)}`} className="font-mono text-sm text-blue-600 hover:underline">
                      {ec.containerQr}
                    </Link>
                    <StatusBadge status={ec.container.status} />
                    {ec.container.culture && <span className="text-sm text-gray-500">{ec.container.culture.name}</span>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => removeCultureMutation.mutate({ id, containerQr: ec.containerQr })}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No cultures assigned yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Entries Timeline */}
      <Card>
        <CardHeader><CardTitle className="text-base">Entries</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddEntry} className="space-y-3 border-b pb-4">
            <div className="flex gap-2">
              <Select value={entryType} onValueChange={setEntryType}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="log">Log</SelectItem>
                  <SelectItem value="observation">Observation</SelectItem>
                  <SelectItem value="result">Result</SelectItem>
                </SelectContent>
              </Select>
              <Select value={entryCreatedBy} onValueChange={setEntryCreatedBy}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Employee" /></SelectTrigger>
                <SelectContent>
                  {(employees ?? []).filter(e => e.isActive).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea value={entryContent} onChange={(e) => setEntryContent(e.target.value)} placeholder="Add an entry..." rows={2} />
            <Button type="submit" size="sm" disabled={addEntryMutation.isPending || !entryContent.trim()}>Add Entry</Button>
          </form>

          {experiment.entries && experiment.entries.length > 0 ? (
            <div className="space-y-3">
              {experiment.entries.map((entry) => (
                <div key={entry.id} className="border-l-2 border-gray-200 pl-4 py-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">{entry.entryType}</Badge>
                    <span className="text-xs text-gray-400">{new Date(entry.createdAt).toLocaleString()}</span>
                    <span className="text-xs text-gray-400">by {entry.creator?.name}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{entry.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No entries yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Router wrapper
export default function ExperimentsPage() {
  const { id } = useParams<{ id: string }>();
  if (id) return <ExperimentDetail id={id} />;
  return <ExperimentsList />;
}
