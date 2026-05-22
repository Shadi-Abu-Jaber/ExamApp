import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  createUser,
  deleteUser,
  fetchUsers,
  updateUser,
} from '../../api/users';

import Card from '../../components/Card';
import PageHeader from '../../components/PageHeader';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';

const createSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'LECTURER', 'STUDENT']),
});

const updateSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['ADMIN', 'LECTURER', 'STUDENT']),
  password: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined)
    .refine((value) => !value || value.length >= 6, {
      message: 'Password must be at least 6 characters',
    }),
});

const roleOptions = ['ALL', 'ADMIN', 'LECTURER', 'STUDENT'];

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      role: 'STUDENT',
    },
  });

  const {
    register: editRegister,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      fullName: '',
      email: '',
      role: 'STUDENT',
      password: '',
    },
  });

  const loadUsers = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetchUsers();
      setUsers(res.data || []);
    } catch (err) {
      setUsers([]);
      setErrorMessage(err.response?.data?.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchText = search.toLowerCase();

      const fullName = user.fullName || '';
      const email = user.email || '';

      const matchSearch =
        fullName.toLowerCase().includes(searchText) ||
        email.toLowerCase().includes(searchText);

      const matchRole = roleFilter === 'ALL' || user.role === roleFilter;

      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((user) => user.role === 'ADMIN').length,
      lecturers: users.filter((user) => user.role === 'LECTURER').length,
      students: users.filter((user) => user.role === 'STUDENT').length,
    };
  }, [users]);

  const getRoleVariant = (role) => {
    if (role === 'ADMIN') return 'danger';
    if (role === 'LECTURER') return 'info';
    return 'success';
  };

  const formatDate = (value) => {
    if (!value) return 'Not available';

    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const onCreate = async (data) => {
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await createUser(data);

      reset({
        fullName: '',
        email: '',
        password: '',
        role: 'STUDENT',
      });

      await loadUsers();
      setSuccessMessage('User created successfully.');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Unable to create user.');
    }
  };

  const openEdit = (user) => {
    setEditTarget(user);

    resetEdit({
      fullName: user.fullName || '',
      email: user.email || '',
      role: user.role || 'STUDENT',
      password: '',
    });
  };

  const closeEdit = () => {
    setEditTarget(null);

    resetEdit({
      fullName: '',
      email: '',
      role: 'STUDENT',
      password: '',
    });
  };

  const onUpdate = async (data) => {
    setSuccessMessage('');
    setErrorMessage('');

    if (!editTarget) return;

    setIsSaving(true);

    try {
      const payload = {
        fullName: data.fullName,
        email: data.email,
        role: data.role,
      };

      if (data.password) {
        payload.password = data.password;
      }

      await updateUser(editTarget.id, payload);
      await loadUsers();

      setSuccessMessage('User updated successfully.');
      closeEdit();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Unable to update user.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (user) => {
    setDeleteTarget(user);
  };

  const closeDelete = () => {
    setDeleteTarget(null);
  };

  const onDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await deleteUser(deleteTarget.id);
      await loadUsers();

      setSuccessMessage('User deleted successfully.');
      closeDelete();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Unable to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="User Management"
        subtitle="Create, edit, search, filter, and manage system users"
      />

      {successMessage && (
        <div className="mb-4">
          <Alert type="success">{successMessage}</Alert>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4">
          <Alert type="error">{errorMessage}</Alert>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm font-medium text-slate-500">Total Users</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {stats.total}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Admins</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {stats.admins}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Lecturers</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {stats.lecturers}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Students</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {stats.students}
          </p>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <Input
            label="Search"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Role filter
            </label>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role === 'ALL' ? 'All roles' : role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">
              Create User
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add a new admin, lecturer, or student account.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onCreate)}>
            <Input
              label="Full name"
              placeholder="Example: John Smith"
              {...register('fullName')}
              error={errors.fullName?.message}
            />

            <Input
              label="Email"
              placeholder="user@example.com"
              {...register('email')}
              type="email"
              error={errors.email?.message}
            />

            <Input
              label="Password"
              placeholder="At least 6 characters"
              {...register('password')}
              type="password"
              error={errors.password?.message}
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Role
              </label>

              <select
                {...register('role')}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ADMIN">Admin</option>
                <option value="LECTURER">Lecturer</option>
                <option value="STUDENT">Student</option>
              </select>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </Button>
          </form>
        </Card>

        <Card>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Existing Users
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredUsers.length} user
                {filteredUsers.length === 1 ? '' : 's'} found
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              title="No users found"
              description="Try a different search term or role filter."
            />
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {user.fullName || 'Unnamed user'}
                      </div>

                      <div className="text-sm text-slate-500">
                        {user.email || 'No email'}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant={getRoleVariant(user.role)}>
                          {user.role}
                        </Badge>

                        <span className="text-slate-400">
                          Created {formatDate(user.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => openEdit(user)}
                      >
                        Edit
                      </Button>

                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => confirmDelete(user)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal open={!!editTarget} onClose={closeEdit} title="Edit User">
        {editTarget && (
          <form className="space-y-4" onSubmit={handleEditSubmit(onUpdate)}>
            <Input
              label="Full name"
              {...editRegister('fullName')}
              error={editErrors.fullName?.message}
            />

            <Input
              label="Email"
              {...editRegister('email')}
              type="email"
              error={editErrors.email?.message}
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Role
              </label>

              <select
                {...editRegister('role')}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ADMIN">Admin</option>
                <option value="LECTURER">Lecturer</option>
                <option value="STUDENT">Student</option>
              </select>
            </div>

            <Input
              label="New password"
              placeholder="Leave empty to keep current password"
              {...editRegister('password')}
              type="password"
              error={editErrors.password?.message}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={closeEdit}>
                Cancel
              </Button>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!deleteTarget} onClose={closeDelete} title="Confirm Delete">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-slate-700">
              Are you sure you want to delete this user?
            </p>

            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              <div className="font-semibold text-slate-900">
                {deleteTarget.fullName}
              </div>
              <div>{deleteTarget.email}</div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={closeDelete}>
                Cancel
              </Button>

              <Button
                type="button"
                variant="danger"
                onClick={onDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default UsersPage;