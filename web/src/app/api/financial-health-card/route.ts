import { NextResponse } from 'next/server';
import { getFinancialHealthCard, getRecommendations, getMsmeData } from '@/lib/db';
import { mockProfiles } from '@/lib/mockConnectorData';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const msmeId = searchParams.get('msmeId');
    if (!msmeId) {
      return NextResponse.json({ error: 'msmeId is required' }, { status: 400 });
    }

    const card = await getFinancialHealthCard(msmeId);
    const recommendations = await getRecommendations(msmeId);
    const rawData = await getMsmeData(msmeId);

    if (!card) {
      return NextResponse.json({ error: 'Financial health card not found' }, { status: 404 });
    }

    // Attempt to dynamically fetch/regenerate the audit_trail based on the gstin profile mapping
    let audit_trail = null;
    const gstin = rawData?.msme?.gstin;
    let matchingProfileKey = Object.keys(mockProfiles).find(key => mockProfiles[key].gstin === gstin);
    if (matchingProfileKey) {
      const profile = mockProfiles[matchingProfileKey];
      try {
        const response = await fetch('http://localhost:8000/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gst: rawData.gst && rawData.gst.length > 0 ? rawData.gst : profile.gst,
            upi: rawData.upi && rawData.upi.length > 0 ? rawData.upi : profile.upi,
            aa: rawData.aa && rawData.aa.length > 0 ? rawData.aa : profile.aa,
            epfo: rawData.epfo && rawData.epfo.length > 0 ? rawData.epfo : profile.epfo,
            cibil_score: profile.cibil_score,
            cheque_bounces_3m: profile.cheque_bounces_3m,
            gst_filing_delay_days: profile.gst_filing_delay_days,
            industry_growth_rate: profile.industry_growth_rate
          })
        });
        if (response.ok) {
          const apiData = await response.json();
          audit_trail = apiData?.scores?.audit_trail;
        }
      } catch (err) {
        console.warn("Could not fetch audit trail from FastAPI on load", err);
      }
    }

    return NextResponse.json({
      success: true,
      card: {
        ...card,
        audit_trail
      },
      recommendations,
      rawData
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
