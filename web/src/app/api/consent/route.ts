import { NextResponse } from 'next/server';
import { createMsme, grantConsent } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { userId, businessName, gstin, riskType } = await request.json();
    if (!userId || !businessName || !gstin) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 1. Create the MSME record
    const msme = await createMsme(userId, businessName, gstin);
    
    // 2. Register consent immediately
    const updatedMsme = await grantConsent(msme.id);

    return NextResponse.json({ 
      success: true, 
      msme: updatedMsme,
      riskType: riskType || 'low-risk' 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
