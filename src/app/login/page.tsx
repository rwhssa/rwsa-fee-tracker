'use client';

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      console.log(result.user);
      router.push('/'); // Redirect to home page after login
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 max-w-sm w-full text-center">
        <h1 className="text-3xl font-bold text-white mb-6">RWSA Fee Tracker</h1>
        <p className="text-gray-400 mb-8">請使用學生會公用 Google 帳號登入</p>
        <button onClick={handleLogin} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition w-full">
          使用 Google 登入
        </button>
      </div>
    </div>
  );
}
