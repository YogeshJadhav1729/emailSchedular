'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';

export default function Home() {
  const router = useRouter();
  const { user, loading, login } = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const decoded: any = jwtDecode(credentialResponse.credential);
      
      await login({
        email: decoded.email,
        name: decoded.name,
        avatar: decoded.picture,
        googleId: decoded.sub,
      });

      toast.success('Successfully logged in!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to login. Please try again.');
    }
  };

  const handleGoogleError = () => {
    toast.error('Google login failed. Please try again.');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              📧 Email Scheduler
            </h1>
            <p className="text-gray-600">
              Production-grade email scheduling system
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="font-semibold text-blue-900 mb-2">Features:</h2>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Schedule emails for future delivery</li>
                <li>✓ Rate limiting & concurrency control</li>
                <li>✓ Persistent job queue with BullMQ</li>
                <li>✓ CSV email list upload</li>
                <li>✓ Real-time dashboard</li>
              </ul>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="filled_blue"
                size="large"
                text="continue_with"
                shape="rectangular"
              />
            </div>

            <p className="text-xs text-center text-gray-500">
              By continuing, you agree to use Google OAuth for authentication
            </p>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
