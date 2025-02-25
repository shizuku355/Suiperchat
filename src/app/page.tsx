'use client';

import { useState, useEffect } from 'react';
import { SuiClient } from '@mysten/sui/client';

// SuiClientのインスタンスを作成
const client = new SuiClient({
  url: 'https://fullnode.mainnet.sui.io'
});

// フォントをインポート
import { Roboto, Orbitron } from 'next/font/google';

// フォントの設定
const roboto = Roboto({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const orbitron = Orbitron({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export default function Suiperchat() {
  // 配信者情報
  const [streamerAddress, setStreamerAddress] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  
  // 視聴者メッセージ
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState(0.1);
  const [exactAmount, setExactAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 受信したチャット
  const [chats, setChats] = useState<any[]>([]);
  const [isCheckingTx, setIsCheckingTx] = useState(false);
  
  // 既存のステート変数に追加
  const [viewerUrl, setViewerUrl] = useState('');
  
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
  
  // メッセージを準備する関数
  const prepareMessage = () => {
    if (!name || !message || !streamerAddress) return;
    
    // 一意の金額を生成
    const randomDecimals = Math.floor(Math.random() * 1000); // 0-999の範囲
    const generatedAmount = parseFloat((amount + randomDecimals / 10000).toFixed(4));
    setExactAmount(generatedAmount);
    
    setIsLoading(true);
    
    try {
      // ここでメッセージをローカルストレージに保存
      const newMessage = {
        id: Date.now().toString(),
        name,
        message,
        amount: generatedAmount,
        streamerAddress,
        timestamp: new Date(),
        confirmed: false
      };
      
      // ローカルストレージに保存
      const messages = JSON.parse(localStorage.getItem('messages') || '[]');
      messages.push(newMessage);
      localStorage.setItem('messages', JSON.stringify(messages));
      
      // 金額インデックスも保存
      const amountIndex = JSON.parse(localStorage.getItem('amountIndex') || '{}');
      amountIndex[generatedAmount.toFixed(4)] = newMessage.id;
      localStorage.setItem('amountIndex', JSON.stringify(amountIndex));
      
    } catch (error) {
      console.error('メッセージ準備エラー:', error);
      alert('メッセージの準備に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 新しいメッセージを作成する関数
  const createNewMessage = () => {
    setExactAmount(null);
    setName('');
    setMessage('');
  };
  
  // コンポーネントのマウント時にローカルストレージからチャットを読み込む
  useEffect(() => {
    try {
      // ローカルストレージからメッセージを取得
      const messages = JSON.parse(localStorage.getItem('messages') || '[]');
      
      // 確認済みのメッセージのみをチャットとして表示
      const confirmedChats = messages.filter((m: any) => m.confirmed);
      
      if (confirmedChats.length > 0) {
        setChats(confirmedChats);
      }
      
      console.log('Loaded confirmed chats from localStorage:', confirmedChats);
    } catch (error) {
      console.error('Error loading chats from localStorage:', error);
    }
  }, []);
  
  // トランザクションのイベントを取得する関数を追加
  const getTransactionEvents = async (txDigest: string) => {
    try {
      const events = await client.queryEvents({
        query: { Transaction: txDigest }
      });
      
      console.log('Transaction events:', events);
      return events.data;
    } catch (error) {
      console.error('Error fetching transaction events:', error);
      return [];
    }
  };
  
  // getSuiReceiveTransactions関数を更新
  const getSuiReceiveTransactions = async (address: string) => {
    try {
      const response = await fetch('/api/sui-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });
      
      if (!response.ok) {
        console.error('APIリクエストに失敗しました', response.status, response.statusText);
        return []; // エラーの場合は空の配列を返す
      }
      
      const data = await response.json();
      return data.transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  };
  
  // チェックポイントを確認する関数を更新
  const checkTransactions = async () => {
    try {
      const address = localStorage.getItem('walletAddress');
      if (!address) {
        console.log('Wallet address not found');
        return;
      }

      const transactions = await getSuiReceiveTransactions(address);
      console.log('Received SUI transactions:', transactions);

      // メッセージの処理
      const messages = JSON.parse(localStorage.getItem('messages') || '[]');
      const amountIndex = JSON.parse(localStorage.getItem('amountIndex') || '{}');
      const confirmedMessages: any[] = [];

      for (const tx of transactions) {
        const balanceChanges = tx.balanceChanges || [];
        console.log('Balance changes for tx:', tx.digest, balanceChanges);
        
        for (const change of balanceChanges) {
          console.log('Checking change:', change);
          
          if (
            change.coinType === '0x2::sui::SUI' && 
            change.owner.AddressOwner === address &&
            BigInt(change.amount) > 0
          ) {
            const amountStr = (Number(change.amount) / 1000000000).toFixed(4);  // SUIの単位変換（Mist to SUI）
            console.log('Found SUI receive:', amountStr);
            
            if (amountStr in amountIndex) {
              console.log('Found matching message for amount:', amountStr);
              const messageId = amountIndex[amountStr];
              const message = messages.find((m: any) => m.id === messageId);
              
              if (message && !message.confirmed) {
                console.log('Confirming message:', message);
                confirmedMessages.push({
                  ...message,
                  confirmed: true,
                  txDigest: tx.digest
                });
              }
            }
          }
        }
      }

      // メッセージの更新とチャットの更新
      if (confirmedMessages.length > 0) {
        console.log('Confirmed messages:', confirmedMessages);
        
        const updatedMessages = messages.map((message: any) => {
          const confirmedMessage = confirmedMessages.find((m: any) => m.id === message.id);
          return confirmedMessage || message;
        });

        localStorage.setItem('messages', JSON.stringify(updatedMessages));
        
        // チャットの状態も更新
        setChats(prev => [...prev, ...confirmedMessages]);
        
        console.log('Messages updated:', updatedMessages);
      }

    } catch (error) {
      console.error('Error checking transactions:', error);
    }
  };
  
  // 定期的にトランザクションを確認
  useEffect(() => {
    if (!streamerAddress) return;
    
    console.log('Setting up automatic transaction checking for address:', streamerAddress);
    
    // 1分ごとにトランザクションを確認
    const intervalId = setInterval(() => {
      console.log('Auto-checking transactions...');
      checkTransactions();
    }, 60000); // 30000 を 60000 に変更
    
    // クリーンアップ関数
    return () => {
      clearInterval(intervalId);
    };
  }, [streamerAddress]);
  
  // Sui SDKのバージョンを確認
  useEffect(() => {
    try {
      // パッケージのバージョン確認方法を変更
      console.log('Using Sui SDK');
    } catch (e) {
      console.log('Could not determine Sui SDK version');
    }
  }, []);
  
  // streamerAddressを入力したときに、walletAddressとしても保存する必要があります
  const handleStreamerAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setStreamerAddress(address);
    localStorage.setItem('walletAddress', address);
  };
  
  // useEffectを追加
  useEffect(() => {
    const savedAddress = localStorage.getItem('walletAddress');
    if (savedAddress) {
      setStreamerAddress(savedAddress);
    }
  }, []);
  
  // 配信者アドレスが設定されたときにURLを生成
  useEffect(() => {
    if (streamerAddress) {
      // 現在のホスト名を取得してビューアーURLを生成
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/viewer?address=${streamerAddress}`;
      setViewerUrl(url);
    } else {
      setViewerUrl('');
    }
  }, [streamerAddress]);
  
  return (
    <div className={`container mx-auto px-4 py-8 max-w-4xl text-white ${roboto.className}`} style={{ backgroundColor: '#121212' }}>
      <h1 className={`text-3xl font-bold text-center mb-8 ${orbitron.className}`} style={{ color: '#E53935', letterSpacing: '2px' }}>SUIPERCHAT</h1>
      
      {/* 配信者情報セクション */}
      <div className="p-6 rounded-lg mb-8" style={{ backgroundColor: '#1E1E1E', borderLeft: '3px solid #E53935' }}>
        <h2 className={`text-xl font-bold mb-4 ${orbitron.className}`} style={{ color: '#FFFFFF' }}>STREAMER INFO</h2>
        
        <div className="mb-4">
          <label className="block mb-2" style={{ color: '#CCCCCC' }}>WALLET ADDRESS</label>
          <input
            type="text"
            value={streamerAddress}
            onChange={handleStreamerAddressChange}
            className="w-full p-2 border rounded"
            placeholder="0x..."
            style={{ backgroundColor: '#2A2A2A', borderColor: '#333333', color: '#FFFFFF' }}
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-2" style={{ color: '#CCCCCC' }}>QR CODE (OPTIONAL)</label>
          <input
            type="file"
            onChange={handleQrCodeUpload}
            className="w-full p-2 border rounded"
            accept="image/*"
            style={{ backgroundColor: '#2A2A2A', borderColor: '#333333', color: '#FFFFFF' }}
          />
        </div>
        
        {qrCodeImage && (
          <div className="mt-4 flex justify-center">
            <img
              src={qrCodeImage}
              alt="QR Code"
              className="max-w-full h-auto max-h-64"
            />
          </div>
        )}
      </div>
      
      {/* メッセージ送信フォーム */}
      <div className="p-6 rounded-lg mb-8" style={{ backgroundColor: '#1E1E1E', borderLeft: '3px solid #E53935' }}>
        <h2 className={`text-xl font-bold mb-4 ${orbitron.className}`} style={{ color: '#FFFFFF' }}>SEND MESSAGE</h2>
        
        {!exactAmount ? (
          <form onSubmit={prepareMessage}>
            <div className="mb-4">
              <label className="block mb-2" style={{ color: '#CCCCCC' }}>NAME</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Your name"
                style={{ backgroundColor: '#2A2A2A', borderColor: '#333333', color: '#FFFFFF' }}
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-2" style={{ color: '#CCCCCC' }}>MESSAGE</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="Enter your message"
                style={{ backgroundColor: '#2A2A2A', borderColor: '#333333', color: '#FFFFFF' }}
              ></textarea>
            </div>
            
            <div className="mb-6">
              <label className="block mb-2" style={{ color: '#CCCCCC' }}>AMOUNT (SUI)</label>
              <select
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                className="w-full p-2 border rounded"
                style={{ backgroundColor: '#2A2A2A', borderColor: '#333333', color: '#FFFFFF' }}
              >
                <option value={0.1}>0.1 SUI</option>
                <option value={0.5}>0.5 SUI</option>
                <option value={1}>1 SUI</option>
                <option value={3}>3 SUI</option>
                <option value={5}>5 SUI</option>
                <option value={10}>10 SUI</option>
              </select>
            </div>
            
            <button
              type="submit"
              className={`w-full p-3 rounded font-bold ${orbitron.className}`}
              disabled={isLoading || !streamerAddress}
              style={{ backgroundColor: '#E53935', color: 'white' }}
            >
              {isLoading ? 'PROCESSING...' : 'PREPARE MESSAGE'}
            </button>
          </form>
        ) : (
          <div className="p-4 border rounded" style={{ backgroundColor: '#2A2A2A', borderColor: '#333333' }}>
            <h3 className={`font-bold text-lg mb-2 ${orbitron.className}`} style={{ color: '#FFFFFF' }}>PAYMENT INSTRUCTIONS</h3>
            <p className="mb-4" style={{ color: '#CCCCCC' }}>Follow these steps to complete your Suiperchat:</p>
            <ol className="list-decimal pl-5 space-y-2" style={{ color: '#CCCCCC' }}>
              <li>Open your preferred Sui wallet</li>
              <li>Send <strong className={orbitron.className} style={{ color: '#E53935' }}>{exactAmount.toFixed(4)} SUI</strong> to this address:<br />
                <code className="p-1 rounded break-all" style={{ backgroundColor: '#333333' }}>{streamerAddress}</code>
              </li>
              <li style={{ color: '#E53935', fontWeight: 'bold' }}>
                IMPORTANT: Send exactly {exactAmount.toFixed(4)} SUI
              </li>
              <li>Your message will appear once the transaction is confirmed</li>
            </ol>
            
            <div className="p-3 rounded mt-4 mb-4" style={{ backgroundColor: '#333333', border: '1px solid #444444' }}>
              <h4 className={`font-bold mb-1 ${orbitron.className}`} style={{ color: '#E53935' }}>WHY THIS SPECIFIC AMOUNT?</h4>
              <p className="text-sm" style={{ color: '#AAAAAA' }}>
                Since Sui wallets don't have a message field, <strong>we use the exact amount as a message ID</strong>.<br />
                For example, "{exactAmount.toFixed(4)} SUI" allows us to precisely identify your message.<br />
                <span style={{ color: '#E53935' }}>注意: 金額を変更すると、メッセージが届かなくなります。</span><br />
                <span style={{ color: '#E53935' }}>CAUTION: Changing the amount will prevent your message from being delivered.</span>
              </p>
            </div>
            
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(exactAmount.toFixed(4));
                  alert('Amount copied to clipboard');
                }}
                className={`px-3 py-1 rounded ${orbitron.className}`}
                style={{ backgroundColor: '#333333', color: '#FFFFFF', border: '1px solid #444444' }}
              >
                COPY AMOUNT
              </button>
              <button
                onClick={createNewMessage}
                className={`px-3 py-1 rounded ${orbitron.className}`}
                style={{ backgroundColor: '#E53935', color: 'white' }}
              >
                NEW MESSAGE
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* チャット表示セクション */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: '#1E1E1E', borderLeft: '3px solid #E53935' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${orbitron.className}`} style={{ color: '#FFFFFF' }}>RECEIVED MESSAGES</h2>
          <button
            onClick={checkTransactions}
            className={`px-3 py-1 rounded text-sm ${orbitron.className}`}
            disabled={isCheckingTx || !streamerAddress}
            style={{ backgroundColor: '#E53935', color: 'white' }}
          >
            {isCheckingTx ? 'CHECKING...' : 'CHECK NOW'}
          </button>
        </div>
        
        {chats.length === 0 ? (
          <p className="text-center py-8" style={{ color: '#888888' }}>NO MESSAGES YET</p>
        ) : (
          <div className="space-y-4">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: '#2A2A2A',
                  borderColor: chat.amount >= 10 ? '#E53935' :
                    chat.amount >= 5 ? '#D32F2F' :
                      chat.amount >= 3 ? '#C62828' :
                        chat.amount >= 1 ? '#B71C1C' :
                          chat.amount >= 0.5 ? '#8E0000' :
                            '#444444',
                  borderLeft: `4px solid ${
                    chat.amount >= 10 ? '#E53935' :
                      chat.amount >= 5 ? '#D32F2F' :
                        chat.amount >= 3 ? '#C62828' :
                          chat.amount >= 1 ? '#B71C1C' :
                            chat.amount >= 0.5 ? '#8E0000' :
                              '#444444'
                  }`
                }}
              >
                <div className="flex justify-between mb-2">
                  <span className={`font-bold ${orbitron.className}`} style={{ color: '#FFFFFF' }}>{chat.name}</span>
                  <span className={`font-bold ${orbitron.className}`} style={{ color: '#E53935' }}>{chat.amount.toFixed(4)} SUI</span>
                </div>
                <p style={{ color: '#CCCCCC' }}>{chat.message}</p>
                {chat.txDigest && (
                  <div className="mt-2 text-xs">
                    <a
                      href={`https://explorer.sui.io/txblock/${chat.txDigest}?network=mainnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#E53935', textDecoration: 'underline' }}
                    >
                      VIEW TRANSACTION
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 視聴者用URL表示セクション */}
      {streamerAddress && (
        <div className="mt-4 mb-6 p-4 rounded" style={{ backgroundColor: '#2A2A2A', border: '1px solid #444444' }}>
          <h3 className={`font-bold mb-3 ${orbitron.className}`} style={{ color: '#E53935' }}>視聴者用リンク</h3>
          <p className="mb-2" style={{ color: '#CCCCCC' }}>このリンクを視聴者に共有して、Suiperchatを受け取れるようにしましょう：</p>
          
          <div className="flex items-center">
            <input
              type="text"
              value={viewerUrl}
              readOnly
              className="flex-grow p-2 border rounded-l font-mono text-sm"
              style={{ backgroundColor: '#333333', borderColor: '#444444', color: '#FFFFFF' }}
            />
            <button
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(viewerUrl)
                    .then(() => alert('リンクをコピーしました'))
                    .catch(err => console.error('コピーに失敗しました:', err));
                } else {
                  // フォールバック
                  const textArea = document.createElement('textarea');
                  textArea.value = viewerUrl;
                  document.body.appendChild(textArea);
                  textArea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textArea);
                  alert('リンクをコピーしました');
                }
              }}
              className={`px-4 py-2 rounded-r font-bold ${orbitron.className}`}
              style={{ backgroundColor: '#E53935', color: 'white' }}
            >
              コピー
            </button>
          </div>
          
          <div className="mt-3 flex justify-center">
            <a
              href={viewerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-2 rounded text-center ${orbitron.className}`}
              style={{ backgroundColor: '#333333', color: '#FFFFFF', textDecoration: 'none', display: 'inline-block' }}
            >
              視聴者ページを開く
            </a>
          </div>
        </div>
      )}
    </div>
  );
}