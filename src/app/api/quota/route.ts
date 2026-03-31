import { NextRequest, NextResponse } from 'next/server';
import { checkQuota } from '@/lib/quota';

export async function GET(req: NextRequest) {
  const quoteId = req.nextUrl.searchParams.get('quoteId') ?? '';
  const result = await checkQuota(quoteId);
  return NextResponse.json(result);
}
