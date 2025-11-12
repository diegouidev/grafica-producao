// src/app/page.tsx

"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace('/dashboard'); // Redireciona para o novo dashboard
      } else {
        router.replace('/login');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
    </div>
  );
}