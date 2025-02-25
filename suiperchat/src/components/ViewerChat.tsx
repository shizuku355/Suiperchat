'use client';

import { useState, useEffect } from 'react';

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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!streamerAddress) {
      alert('配信者のアドレスを入力してください');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // メッセージをサーバーに保存
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          message,
          amount,
          streamerAddress,
        }),
      });
      
      if (!response.ok) {
        throw new Error('APIエラー');
      }
      
      const data = await response.json();
      setExactAmount(data.exactAmount);
    } catch (error) {
      console.error('メッセージ保存エラー:', error);
      alert('メッセージの保存に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      {/* 配信者情報表示 */}
      {streamerInfo && (
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-bold mb-2">配信者情報</h2>
          <p className="mb-2">アドレス: <span className="font-mono break-all">{streamerInfo.address}</span></p>
          
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
          <h2 className="text-xl font-bold mb-4">Suiperchatを送信</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">配信者のウォレットアドレス</label>
            <input
              type="text"
              value={streamerAddress}
              onChange={(e) => setStreamerAddress(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="0x..."
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">表示名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="あなたの名前"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">メッセージ</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="メッセージを入力"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">金額 (SUI)</label>
            <select
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              className="w-full p-2 border rounded"
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
            className="w-full bg-blue-500 text-white p-3 rounded font-bold hover:bg-blue-600"
            disabled={isLoading}
          >
            {isLoading ? '処理中...' : 'メッセージを準備する'}
          </button>
        </form>
      ) : (
        <div className="p-4 border rounded bg-gray-50">
          <h3 className="font-bold text-lg mb-2">送金手順</h3>
          <p className="mb-4">以下の手順でSuiperchatを完了させてください：</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>お好みのSuiウォレットを開く</li>
            <li>以下のアドレスに<strong className="text-red-500">{exactAmount.toFixed(4)} SUI</strong>を送金：<br />
              <code className="bg-gray-200 p-1 rounded break-all">{streamerAddress}</code>
            </li>
            <li className="text-red-500 font-bold">
              重要: 必ず正確に{exactAmount.toFixed(4)} SUIを送金してください
            </li>
            <li>送金が完了すると、あなたのメッセージが配信者に表示されます</li>
          </ol>
          
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mt-4 mb-4">
            <h4 className="font-bold text-yellow-800 mb-1">なぜ複雑な金額なのか？</h4>
            <p className="text-sm text-yellow-800">
              Suiウォレットにはメッセージ欄がないため、<strong>金額自体をメッセージIDとして使用</strong>しています。
              例えば「0.3425 SUI」のような複雑な金額を使うことで、あなたのメッセージを正確に識別できます。
              金額を変更すると、メッセージが配信者に届かなくなる可能性があるのでご注意ください。
            </p>
          </div>
          
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(exactAmount.toFixed(4));
                alert('金額をコピーしました');
              }}
              className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
            >
              金額をコピー
            </button>
            <button
              onClick={() => setExactAmount(null)}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              新しいメッセージを作成
            </button>
          </div>
        </div>
      )}
    </div>
  );
}