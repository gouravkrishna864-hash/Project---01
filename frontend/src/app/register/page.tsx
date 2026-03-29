'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import Link from 'next/link';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['buyer', 'broker', 'builder']),
  city: z.string().optional(),
});

type RegisterForm = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { fetchMe } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'buyer' },
  });

  const role = watch('role');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      if (typeof window !== 'undefined') {
        localStorage.setItem('reos_access_token', res.data.data.accessToken);
        localStorage.setItem('reos_refresh_token', res.data.data.refreshToken);
      }
      await fetchMe();
      toast.success('Account created successfully!');

      const redirectMap: Record<string, string> = {
        broker: '/broker/dashboard',
        builder: '/builder/dashboard',
        buyer: '/dashboard',
      };
      router.push(redirectMap[data.role] || '/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700">REOS</h1>
          <p className="text-gray-500 mt-1">Create your account</p>
        </div>

        <div className="card p-8">
          {/* Role Selector */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {(['buyer', 'broker', 'builder'] as const).map((r) => (
              <label
                key={r}
                className={`text-center py-3 rounded-xl border-2 cursor-pointer transition-all ${
                  role === r ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <input {...register('role')} type="radio" value={r} className="sr-only" />
                <div className="text-xl mb-1">
                  {r === 'buyer' ? '🏠' : r === 'broker' ? '👔' : '🏗️'}
                </div>
                <div className="text-xs font-medium capitalize">{r}</div>
              </label>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Full Name</label>
              <input {...register('name')} className="input" placeholder="Rahul Sharma" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
              <input {...register('email')} type="email" className="input" placeholder="rahul@example.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Mobile Number</label>
              <input {...register('phone')} type="tel" className="input" placeholder="9876543210" />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">City</label>
              <input {...register('city')} className="input" placeholder="Pune" />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
              <input {...register('password')} type="password" className="input" placeholder="••••••••" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5">
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
