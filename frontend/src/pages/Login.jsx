import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { loginRequest } from '../api/auth';
import { useAuth } from '../context/AuthContext';

import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import Alert from '../components/Alert';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const dashboardByRole = {
  ADMIN: '/admin/dashboard',
  LECTURER: '/lecturer/dashboard',
  STUDENT: '/student/dashboard',
};

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setError('');

    try {
      const response = await loginRequest(data);

      const user = response.data.user;
      const token = response.data.token;

      login(user, token);

      const targetPath = dashboardByRole[user.role] || '/login';
      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your email and password.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <Card>
          <PageHeader
            title="ExamFlow"
            subtitle="Online exam management system"
          />

          {error && (
            <div className="mb-4">
              <Alert type="error">{error}</Alert>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Email"
              type="email"
              placeholder="admin@examflow.com"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              {...register('password')}
              error={errors.password?.message}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              className="font-medium text-blue-600 hover:text-blue-700"
              onClick={() => navigate('/register')}
            >
              Register
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="mb-2 font-semibold text-slate-900">
              Demo accounts
            </div>

            <div>
              Admin:{' '}
              <span className="font-medium">admin@examflow.com</span> /{' '}
              <span className="font-medium">Admin123!</span>
            </div>

            <div>
              Lecturer:{' '}
              <span className="font-medium">lecturer@examflow.com</span> /{' '}
              <span className="font-medium">Lecturer123!</span>
            </div>

            <div>
              Student:{' '}
              <span className="font-medium">student@examflow.com</span> /{' '}
              <span className="font-medium">Student123!</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;