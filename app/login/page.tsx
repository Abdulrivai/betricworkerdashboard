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

      // Save user info to localStorage (for client-side access)
      if (data.user) {
        localStorage.setItem('current_user', JSON.stringify(data.user));

        // Only save worker_id if user is actually a worker
        if (data.user.role === 'worker') {
          localStorage.setItem('current_worker_id', data.user.id);
          console.log('✅ Worker info saved to localStorage:', data.user);
        } else if (data.user.role === 'admin') {
          // Clear any existing worker_id if admin logs in
          localStorage.removeItem('current_worker_id');
          console.log('✅ Admin info saved to localStorage:', data.user);
        }
      }

      // Redirect based on role
      if (data.user.role === 'admin') {
        console.log('Redirecting to admin...');
        router.push('/admin');
      } else if (data.user.role === 'worker') {
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

          <div className="bg-gradient-to-br from-white/10 via-gray-900/50 to-black/40 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 border border-blue-400/30 glow-form-blue hover:border-blue-400/50 transition-all duration-500">
            <form onSubmit={handleSubmit} className="space-y-7">
              {error && (
                <div className="bg-red-500/15 border-l-4 border-red-500 rounded-lg p-4 backdrop-blur-sm animate-shake">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-300 text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Email Input with Icon */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-white mb-2 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  <span>Email Address</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <svg className="w-5 h-5 text-blue-400 group-focus-within:text-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-blue-400/30 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 bg-black text-white placeholder-gray-500 hover:border-blue-400/50 focus:bg-black"
                    placeholder="nama@email.com"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Input with Icon */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-white mb-2 flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Password</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <svg className="w-5 h-5 text-blue-400 group-focus-within:text-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-12 py-3.5 border-2 border-blue-400/30 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 bg-black text-white placeholder-gray-500 hover:border-blue-400/50 focus:bg-black"
                    placeholder="Masukkan password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400/70 hover:text-blue-400 transition-all duration-200 p-1.5 rounded-lg hover:bg-blue-400/10 z-10"
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

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center group cursor-pointer">
                  <input
                    type="checkbox"
                    id="remember"
                    disabled={isLoading}
                    className="w-4 h-4 text-cyan-500 border-cyan-400/50 rounded focus:ring-cyan-400 focus:ring-offset-gray-900 bg-gray-900/80 cursor-pointer transition-all"
                  />
                  <label htmlFor="remember" className="ml-2.5 text-sm text-gray-300 cursor-pointer group-hover:text-cyan-300 transition-colors">
                    Ingat saya
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:from-blue-500 hover:to-indigo-500 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed glow-button-blue shadow-lg transform hover:scale-[1.02] active:scale-100"
              >
                <span className="flex items-center justify-center space-x-2">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Masuk...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-cyan-400/10">
              <div className="text-center space-y-2">
                <p className="text-xs text-gray-400 flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4 text-blue-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Akun disediakan oleh administrator</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* Autofill override - force black background and white text */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px black inset !important;
          -webkit-text-fill-color: white !important;
          caret-color: white !important;
        }

        .glow-form-blue {
          box-shadow: 
            0 0 40px rgba(59, 130, 246, 0.25), 
            0 0 80px rgba(59, 130, 246, 0.12),
            inset 0 0 80px rgba(59, 130, 246, 0.03);
        }
        .glow-form-blue:hover {
          box-shadow: 
            0 0 50px rgba(59, 130, 246, 0.3), 
            0 0 100px rgba(59, 130, 246, 0.15),
            inset 0 0 80px rgba(59, 130, 246, 0.05);
        }
        .glow-button-blue {
          box-shadow: 
            0 0 25px rgba(59, 130, 246, 0.4), 
            0 0 50px rgba(59, 130, 246, 0.2);
        }
        .glow-button-blue:hover {
          box-shadow: 
            0 0 35px rgba(59, 130, 246, 0.6), 
            0 0 70px rgba(59, 130, 246, 0.3);
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}