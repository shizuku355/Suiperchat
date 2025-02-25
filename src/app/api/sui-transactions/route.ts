import { NextResponse } from 'next/server';
import { SuiClient } from '@mysten/sui/client';

// SuiClientのインスタンスを作成
const client = new SuiClient({
  url: 'https://fullnode.mainnet.sui.io'
});

export async function POST(request: Request) {
  try {
    const { address } = await request.json();
    
    if (!address) {
      return NextResponse.json({ error: 'アドレスが必要です' }, { status: 400 });
    }
    
    const transactions = await client.queryTransactionBlocks({
      filter: {
        ToAddress: address
      },
      options: {
        showBalanceChanges: true,
        showEffects: true,
        showEvents: true,
        showInput: true
      },
      limit: 20
    });
    
    return NextResponse.json({ transactions: transactions.data });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'トランザクションの取得に失敗しました' }, { status: 500 });
  }
} 