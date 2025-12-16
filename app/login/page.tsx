'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SimpleBackground from '../components/SimpleBackground';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');
  
  try {
    console.log('Attempting login with:', formData.email);
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    console.log('Login response:', data);

    if (!response.ok) {
      throw new Error(data.error || 'Login gagal');
    }

    // Fix: check lowercase role sesuai database
    if (data.user.role === 'admin') {  // lowercase
      console.log('Redirecting to admin...');
      router.push('/admin');
    } else if (data.user.role === 'worker') {  // lowercase
      console.log('Redirecting to worker...');
      router.push('/worker');
    } else {
      throw new Error(`Role tidak valid: ${data.user.role}`);
    }

  } catch (error: any) {
    console.error('Login error:', error);
    setError(error.message || 'Terjadi kesalahan saat login');
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <SimpleBackground />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mb-6 drop-shadow-2xl">
              <Image
                src="/betriclogo.png"
                alt="BETRIC Logo"
                width={200}
                height={200}
                className="mx-auto object-contain filter brightness-110 contrast-110 drop-shadow-lg"
                priority
              />
            </div>
            <p className="text-cyan-200/80 text-sl">Berau Technology and Research Innovation Center</p>
          </div>

          <div className="bg-black/80 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 border border-cyan-400/30 glow-form">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-cyan-300/90 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-cyan-400/40 rounded-lg focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-400/60 transition-all duration-300 bg-gray-900/80 text-white placeholder-gray-400 backdrop-blur-sm"
                  placeholder="masukkan email anda"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-cyan-300/90 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-cyan-400/40 rounded-lg focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-400/60 transition-all duration-300 pr-12 bg-gray-900/80 text-white placeholder-gray-400 backdrop-blur-sm"
                    placeholder="masukkan password anda"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors duration-300"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  disabled={isLoading}
                  className="w-4 h-4 text-cyan-400 border-cyan-400/40 rounded focus:ring-cyan-400/60 bg-gray-900/80"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-300/90">
                  Ingat saya
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-500/90 to-blue-500/90 text-white py-3 px-4 rounded-lg font-medium hover:from-cyan-500 hover:to-blue-500 focus:ring-2 focus:ring-cyan-400/60 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed glow-button shadow-lg backdrop-blur-sm"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Masuk...
                  </div>
                ) : (
                  'Masuk'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400/80">
                Data akun akan disediakan oleh admin
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .glow-form {
          box-shadow: 0 0 30px rgba(34, 211, 238, 0.2), 0 0 60px rgba(34, 211, 238, 0.1);
        }
        .glow-button {
          box-shadow: 0 0 20px rgba(6, 182, 212, 0.4), 0 0 40px rgba(6, 182, 212, 0.2);
        }
        .glow-button:hover {
          box-shadow: 0 0 30px rgba(6, 182, 212, 0.6), 0 0 60px rgba(6, 182, 212, 0.3);
        }
      `}</style>
    </div>
  );
}