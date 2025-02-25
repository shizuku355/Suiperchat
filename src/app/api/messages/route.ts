import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// メモリ内ストレージ（サーバー再起動で消えます）
interface Message {
  id: string;
  name: string;
  message: string;
  amount: number;
  exactAmount: number; // 正確な金額（識別用）
  streamerAddress: string;
  timestamp: Date;
  txDigest?: string;
  confirmed: boolean;
}

export const messages: Record<string, Message> = {};
// 金額をキーとするインデックス
export const amountIndex: Record<string, string> = {};

// 一意の金額を生成する関数
function generateUniqueAmount(baseAmount: number): number {
  // 基本金額に4桁のランダムな数字を小数点以下として追加
  const randomDigits = Math.floor(1000 + Math.random() * 9000); // 1000-9999の範囲
  const exactAmount = parseFloat(`${Math.floor(baseAmount)}.${randomDigits}`);
  
  // 既に使用されている金額でないか確認
  const amountKey = exactAmount.toFixed(4);
  if (amountIndex[amountKey]) {
    // 衝突した場合は再生成
    return generateUniqueAmount(baseAmount);
  }
  
  return exactAmount;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, message, amount, streamerAddress } = body;
    
    if (!name || !message || !amount || !streamerAddress) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }
    
    // 一意の金額を生成
    const exactAmount = generateUniqueAmount(amount);
    const amountKey = exactAmount.toFixed(4);
    
    // メッセージを保存
    const id = uuidv4();
    messages[id] = {
      id,
      name,
      message,
      amount, // 元の金額（表示用）
      exactAmount, // 正確な金額（識別用）
      streamerAddress,
      timestamp: new Date(),
      confirmed: false
    };
    
    // 金額インデックスを更新
    amountIndex[amountKey] = id;
    
    console.log(`メッセージを保存しました: ${id}, 金額: ${exactAmount}`);
    
    return NextResponse.json({ 
      id, 
      exactAmount,
      amountFormatted: exactAmount.toFixed(4)
    });
  } catch (error) {
    console.error('メッセージ保存エラー:', error);
    return NextResponse.json({ error: '内部サーバーエラー' }, { status: 500 });
  }
}