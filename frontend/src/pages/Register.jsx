import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { registerRequest } from '../api/auth';

import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';

const schema = z.object({
  fullName: z.string().min(2, 'Full name must contain at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Register = () => {
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setError('');
    setSuccess('');

    try {
      await registerRequest({
        ...data,
        role: 'STUDENT',
      });

      setSuccess('Student account created successfully. Redirecting to login...');

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 800);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Registration failed. Please check your details.'
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <Card>
          <PageHeader
            title="Student Registration"
            subtitle="Create a student account to access available exams"
          />

          {error && (
            <div className="mb-4">
              <Alert type="error">{error}</Alert>
            </div>
          )}

          {success && (
            <div className="mb-4">
              <Alert type="success">{success}</Alert>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Full name"
              type="text"
              placeholder="Example: John Smith"
              {...register('fullName')}
              error={errors.fullName?.message}
            />

            <Input
              label="Email"
              type="email"
              placeholder="student@example.com"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              {...register('password')}
              error={errors.password?.message}
            />

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
              This registration creates a <strong>Student</strong> account only.
              Admins and lecturers are created by the system administrator.
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : 'Create Student Account'}
            </Button>
          </form>

          <div className="mt-6 text-sm text-slate-600">
            Already have an account?{' '}
            <button
              type="button"
              className="font-medium text-blue-600 hover:text-blue-700"
              onClick={() => navigate('/login')}
            >
              Login
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;