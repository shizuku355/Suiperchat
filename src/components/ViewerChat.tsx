'use client';

import { useState, useEffect } from 'react';
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

export default function ViewerChat() {
  const [streamerAddress, setStreamerAddress] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState(0.1);
  const [exactAmount, setExactAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamerInfo, setStreamerInfo] = useState<any>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  
  // URLからアドレスを取得
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const addressParam = params.get('address');
      
      if (addressParam) {
        setStreamerAddress(addressParam);
        fetchStreamerInfo(addressParam);
      }
    }
  }, []);
  
  // 配信者情報を取得
  const fetchStreamerInfo = async (address: string) => {
    try {
      setIsLoadingInfo(true);
      const response = await fetch(`/api/streamer-info?address=${address}`);
      
      if (response.ok) {
        const data = await response.json();
        setStreamerInfo(data);
      }
    } catch (error) {
      console.error('配信者情報取得エラー:', error);
    } finally {
      setIsLoadingInfo(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 選択された金額に、小数点以下4桁のランダム値を追加
    const randomDecimals = Math.floor(Math.random() * 1000); // 0-999の範囲
    const exactAmountValue = parseFloat((amount + randomDecimals / 10000).toFixed(4));
    setExactAmount(exactAmountValue);
    
    // ここで通常のフォーム送信処理など...
  };
  
  return (
    <div className={`max-w-2xl mx-auto ${roboto.className}`}>
      {/* 配信者情報表示 */}
      {streamerInfo && (
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <h2 className={`text-xl font-bold mb-2 text-gray-800 ${orbitron.className}`}>配信者情報</h2>
          <div className="flex items-center mb-2">
            <p className="text-gray-700 mr-2">アドレス:</p>
            <div className="flex flex-1 items-center">
              <span className="font-mono break-all bg-gray-200 p-2 rounded text-gray-700 flex-1">
                {streamerInfo.address}
              </span>
              <button
                onClick={() => {
                  // クリップボードAPIが利用可能かチェック
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(streamerInfo.address)
                      .then(() => alert('アドレスをコピーしました'))
                      .catch(err => console.error('コピーに失敗しました:', err));
                  } else {
                    // フォールバック方法
                    const textArea = document.createElement('textarea');
                    textArea.value = streamerInfo.address;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    alert('アドレスをコピーしました');
                  }
                }}
                className="ml-2 bg-gray-300 hover:bg-gray-400 text-gray-700 px-2 py-1 rounded"
              >
                コピー
              </button>
            </div>
          </div>
          
          {streamerInfo.qrCodeImage && (
            <div className="flex justify-center mb-2">
              <img 
                src={streamerInfo.qrCodeImage} 
                alt="配信者のQRコード" 
                className="max-w-full max-h-64 border"
              />
            </div>
          )}
        </div>
      )}
      
      {!exactAmount ? (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
          <h2 className={`text-2xl font-bold mb-4 text-gray-800 border-b pb-2 ${orbitron.className}`}>Suiperchatを送信</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">配信者のウォレットアドレス</label>
            <div className="flex">
              <input
                type="text"
                value={streamerAddress}
                onChange={(e) => setStreamerAddress(e.target.value)}
                className="flex-1 p-2 border rounded-l bg-gray-100 text-gray-700 font-mono"
                placeholder="0x..."
                required
              />
              {streamerAddress && (
                <button
                  type="button"
                  onClick={() => {
                    // クリップボードAPIが利用可能かチェック
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(streamerAddress)
                        .then(() => alert('アドレスをコピーしました'))
                        .catch(err => console.error('コピーに失敗しました:', err));
                    } else {
                      // フォールバック方法
                      const textArea = document.createElement('textarea');
                      textArea.value = streamerAddress;
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                      alert('アドレスをコピーしました');
                    }
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 rounded-r"
                >
                  コピー
                </button>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">表示名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded text-black"
              placeholder="あなたの名前"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">メッセージ</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border rounded text-black"
              rows={3}
              placeholder="メッセージを入力"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">金額 (SUI)</label>
            <select
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              className="w-full p-2 border rounded text-black"
            >
              <option value={0.1}>0.1 SUI</option>
              <option value={0.5}>0.5 SUI</option>
              <option value={1}>1 SUI</option>
              <option value={5}>5 SUI</option>
              <option value={10}>10 SUI</option>
              <option value={50}>50 SUI</option>
              <option value={100}>100 SUI</option>
            </select>
          </div>
          
          <button
            type="submit"
            className={`w-full bg-blue-500 text-white p-3 rounded font-bold hover:bg-blue-600 ${orbitron.className}`}
            disabled={isLoading}
          >
            {isLoading ? '処理中...' : 'メッセージを準備する'}
          </button>
        </form>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className={`text-2xl font-bold mb-4 text-gray-800 border-b pb-2 ${orbitron.className}`}>送金手順</h2>
          
          <div className="mb-6">
            <div className="mb-4 text-black">
              <p className="mb-2">以下の情報を使って、お使いのウォレットから送金してください：</p>
              <ul className="list-disc pl-5 mb-3">
                <li>送金先アドレス: <span className="font-mono break-all bg-gray-100 p-1 rounded">{streamerAddress}</span></li>
                <li>金額: <span className="font-bold text-red-600">{exactAmount} SUI</span></li>
              </ul>
              <div className="bg-gray-100 p-3 rounded mb-3 border-l-4 border-red-500">
                <p className="font-bold mb-2">重要：</p>
                <p>表示されている<strong>正確な金額</strong>で送金してください。この特定の金額がメッセージとあなたの送金を紐付けるために使用されます。</p>
              </div>
              <p>送金が完了すると、配信者に表示名とメッセージが表示されます。</p>
            </div>
            
            <button
              onClick={() => setExactAmount(null)}
              className={`w-full bg-gray-300 text-gray-700 p-3 rounded font-bold hover:bg-gray-400 ${orbitron.className}`}
            >
              入力画面に戻る
            </button>
          </div>
        </div>
      )}
    </div>
  );
}