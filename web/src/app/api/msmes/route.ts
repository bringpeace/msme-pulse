import { NextResponse } from 'next/server';
import { getMsmeList } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const msmes = await getMsmeList();
    return NextResponse.json({ success: true, msmes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
