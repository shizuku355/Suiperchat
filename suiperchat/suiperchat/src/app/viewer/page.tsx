'use client';

import ViewerChat from '@/components/ViewerChat';
import { Orbitron, Roboto } from 'next/font/google';

// フォントの設定
const orbitron = Orbitron({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-orbitron',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
});

export default function ViewerPage() {
  return (
    <div className={`container mx-auto px-4 py-8 ${roboto.className}`} style={{ backgroundColor: '#121212' }}>
      <h1 className={`text-3xl font-bold text-center mb-8 ${orbitron.className}`} style={{ color: '#E53935', letterSpacing: '2px' }}>
        SUIPERCHAT
      </h1>
      
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <ViewerChat />
      </div>
    </div>
  );
}