import { useState } from 'react';
import { UserRound, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from '@/hooks/use-employees';
import type { Employee } from '@/types';
import { toast } from 'sonner';

export function EmployeeTab() {
  const { data: employees, isLoading } = useEmployees();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');

  const [editing, setEditing] = useState<Employee | null>(null);
  const [editName, setEditName] = useState('');

  const [deleting, setDeleting] = useState<Employee | null>(null);

  const handleCreate = () => {
    if (!name.trim()) return;
    createEmployee.mutate(
      { name: name.trim() },
      {
        onSuccess: () => {
          toast.success('Employee added');
          setShowAdd(false);
          setName('');
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const openEdit = (employee: Employee) => {
    setEditing(employee);
    setEditName(employee.name);
  };

  const handleUpdate = () => {
    if (!editing || !editName.trim()) return;
    updateEmployee.mutate(
      { id: editing.id, data: { name: editName.trim() } },
      {
        onSuccess: () => {
          toast.success('Employee updated');
          setEditing(null);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteEmployee.mutate(deleting.id, {
      onSuccess: () => {
        toast.success('Employee deleted');
        setDeleting(null);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  if (isLoading) {
    return <div className="py-8 text-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-3">
      {employees?.map((employee) => (
        <div
          key={employee.id}
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-50">
            <UserRound className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900">{employee.name}</p>
              <Badge
                className={
                  employee.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }
              >
                {employee.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              {employee._count?.logs ?? 0}{' '}
              {(employee._count?.logs ?? 0) === 1 ? 'log entry' : 'log entries'}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => openEdit(employee)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(employee)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      ))}

      {employees?.length === 0 && (
        <p className="py-8 text-center text-gray-400">No employees yet.</p>
      )}

      <button
        onClick={() => setShowAdd(true)}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-500 hover:border-amber-400 hover:text-amber-600 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add Employee
      </button>

      {/* Create dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Employee name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || createEmployee.isPending}
            >
              {createEmployee.isPending ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Employee name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!editName.trim() || updateEmployee.isPending}
            >
              {updateEmployee.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{deleting?.name}</strong>? This
            action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteEmployee.isPending}
            >
              {deleteEmployee.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
