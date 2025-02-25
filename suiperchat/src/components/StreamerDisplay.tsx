'use client';

import { useState, useEffect } from 'react';
import StreamerDisplay from './StreamerDisplay';

export default function StreamerView() {
  const [address, setAddress] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'setup' | 'display'>('setup');
  
  // QRコード画像をアップロードする関数
  const handleQrCodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // ファイルサイズチェック (5MB以下)
    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください');
      return;
    }
    
    // 画像ファイルかチェック
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルをアップロードしてください');
      return;
    }
    
    // FileReaderでファイルを読み込む
    const reader = new FileReader();
    reader.onload = (event) => {
      setQrCodeImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // QRコード画像を削除する関数
  const removeQrCodeImage = () => {
    setQrCodeImage(null);
  };
  
  // 配信者情報を保存する関数
  const saveStreamerInfo = async () => {
    if (!address) return;
    
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/streamer-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          qrCodeImage
        }),
      });
      
      if (!response.ok) throw new Error('APIエラー');
      
      // 共有URLを生成
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}?address=${encodeURIComponent(address)}&mode=viewer`;
      setShareUrl(shareUrl);
      
      alert('情報を保存しました。視聴者に共有URLを送ってください。');
    } catch (error) {
      console.error('配信者情報保存エラー:', error);
      alert('情報の保存に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };
  
  // 表示モードに切り替える
  const switchToDisplayMode = () => {
    if (!address) {
      alert('アドレスを入力してください');
      return;
    }
    setDisplayMode('display');
  };
  
  // 設定モードに切り替える
  const switchToSetupMode = () => {
    setDisplayMode('setup');
  };
  
  // 表示モードの場合はStreamerDisplayコンポーネントを表示
  if (displayMode === 'display') {
    return (
      <div className="relative">
        <button
          onClick={switchToSetupMode}
          className="absolute top-2 left-2 bg-gray-800 text-white px-3 py-1 rounded-full text-sm z-20 opacity-50 hover:opacity-100"
        >
          設定に戻る
        </button>
        <StreamerDisplay address={address} />
      </div>
    );
  }
  
  // 設定モードの場合は設定画面を表示
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gray-100 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">あなたのウォレットアドレス</h2>
        
        <div className="mb-4">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="あなたのSuiウォレットアドレスを入力"
          />
        </div>
        
        {address && (
          <>
            <div className="mb-4 p-4 bg-white border rounded-lg">
              <p className="break-all text-center font-mono">{address}</p>
            </div>
            
            {/* QRコードアップロード機能 */}
            <div className="mb-6">
              <h3 className="font-bold mb-2">QRコードのアップロード（任意）</h3>
              
              {qrCodeImage ? (
                <div className="flex flex-col items-center">
                  <img 
                    src={qrCodeImage} 
                    alt="アップロードされたQRコード" 
                    className="max-w-full max-h-64 mb-2 border"
                  />
                  <button
                    onClick={removeQrCodeImage}
                    className="text-red-500 text-sm"
                  >
                    QRコードを削除
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <label className="cursor-pointer bg-white border rounded p-4 mb-2 w-full text-center">
                    <span className="block mb-2 text-gray-600">QRコード画像をアップロード</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrCodeUpload}
                      className="hidden"
                    />
                    <span className="bg-gray-200 px-4 py-2 rounded">ファイルを選択</span>
                  </label>
                  <p className="text-xs text-gray-500">
                    外部サービスで生成したQRコード画像をアップロードできます
                  </p>
                </div>
              )}
            </div>
            
            {/* 情報保存と共有ボタン */}
            <div className="mb-6">
              <button
                onClick={saveStreamerInfo}
                disabled={isSaving}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 mb-2"
              >
                {isSaving ? '保存中...' : '情報を保存して共有URLを生成'}
              </button>
              
              <button
                onClick={switchToDisplayMode}
                className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
              >
                表示モードに切り替え（OBS用）
              </button>
              
              {shareUrl && (
                <div className="mt-4 p-4 bg-white border rounded-lg">
                  <p className="text-sm font-bold mb-2">視聴者に以下のURLを共有してください：</p>
                  <p className="break-all text-sm font-mono mb-2">{shareUrl}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      alert('URLをコピーしました');
                    }}
                    className="w-full bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 text-sm"
                  >
                    URLをコピー
                  </button>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-600 text-center mb-4">
              このアドレス{qrCodeImage ? 'またはQRコード' : ''}を視聴者に共有してSuiperchatを受け取りましょう
            </p>
            
            <div className="flex justify-center">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(address);
                  alert('アドレスをコピーしました');
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                アドレスをコピー
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}