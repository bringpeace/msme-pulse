import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

// Initialize Supabase Client if keys are provided
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// In-Memory Fallback Database for seamless prototyping
class MockDb {
  private store: Record<string, any> = {
    users: [],
    msmes: [],
    gst_summary: [],
    upi_summary: [],
    aa_summary: [],
    epfo_summary: [],
    financial_health_cards: [],
    recommendations: []
  };

  async select(table: string, filters: Record<string, any> = {}): Promise<any[]> {
    let records = this.store[table] || [];
    for (const [key, val] of Object.entries(filters)) {
      records = records.filter((r: any) => r[key] === val);
    }
    return JSON.parse(JSON.stringify(records));
  }

  async insert(table: string, data: any): Promise<any> {
    const record = { 
      id: crypto.randomUUID(), 
      created_at: new Date().toISOString(),
      ...data 
    };
    if (!this.store[table]) this.store[table] = [];
    this.store[table].push(record);
    return JSON.parse(JSON.stringify(record));
  }

  async upsert(table: string, data: any, uniqueKey: string): Promise<any> {
    if (!this.store[table]) this.store[table] = [];
    const index = this.store[table].findIndex(
      (r: any) => r[uniqueKey] === data[uniqueKey]
    );
    const record = { 
      id: index !== -1 ? this.store[table][index].id : crypto.randomUUID(),
      created_at: index !== -1 ? this.store[table][index].created_at : new Date().toISOString(),
      ...data,
      updated_at: new Date().toISOString()
    };
    if (index !== -1) {
      this.store[table][index] = record;
    } else {
      this.store[table].push(record);
    }
    return JSON.parse(JSON.stringify(record));
  }
}

const mockDb = new MockDb();

export async function getMsmeList() {
  if (supabase) {
    const { data, error } = await supabase
      .from('msmes')
      .select(`
        id,
        business_name,
        gstin,
        consent_granted,
        created_at,
        financial_health_cards (
          overall_score,
          risk_category,
          loan_amount
        )
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } else {
    const msmes = await mockDb.select('msmes');
    // Map health cards to match Supabase structure
    const mapped = [];
    for (const msme of msmes) {
      const cards = await mockDb.select('financial_health_cards', { msme_id: msme.id });
      mapped.push({
        ...msme,
        financial_health_cards: cards[0] || null
      });
    }
    // Sort descending by created_at
    return mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

// Unified Database Helpers
export async function getMsmeData(msmeId: string) {
  if (supabase) {
    const { data: msme } = await supabase.from('msmes').select('*').eq('id', msmeId).single();
    const { data: gst } = await supabase.from('gst_summary').select('*').eq('msme_id', msmeId);
    const { data: upi } = await supabase.from('upi_summary').select('*').eq('msme_id', msmeId);
    const { data: aa } = await supabase.from('aa_summary').select('*').eq('msme_id', msmeId);
    const { data: epfo } = await supabase.from('epfo_summary').select('*').eq('msme_id', msmeId);
    
    return {
      msme,
      gst: gst || [],
      upi: upi || [],
      aa: aa || [],
      epfo: epfo || []
    };
  } else {
    const msmeList = await mockDb.select('msmes', { id: msmeId });
    const msme = msmeList[0] || null;
    const gst = await mockDb.select('gst_summary', { msme_id: msmeId });
    const upi = await mockDb.select('upi_summary', { msme_id: msmeId });
    const aa = await mockDb.select('aa_summary', { msme_id: msmeId });
    const epfo = await mockDb.select('epfo_summary', { msme_id: msmeId });
    
    return { msme, gst, upi, aa, epfo };
  }
}

export async function saveGstSummary(msmeId: string, month: string, data: any) {
  const record = { msme_id: msmeId, month, ...data };
  if (supabase) {
    const { data: res, error } = await supabase.from('gst_summary').upsert(record, { onConflict: 'msme_id,month' });
    if (error) throw error;
    return res;
  }
  return mockDb.upsert('gst_summary', record, 'month');
}

export async function saveUpiSummary(msmeId: string, month: string, data: any) {
  const record = { msme_id: msmeId, month, ...data };
  if (supabase) {
    const { data: res, error } = await supabase.from('upi_summary').upsert(record, { onConflict: 'msme_id,month' });
    if (error) throw error;
    return res;
  }
  return mockDb.upsert('upi_summary', record, 'month');
}

export async function saveAaSummary(msmeId: string, month: string, data: any) {
  const record = { msme_id: msmeId, month, ...data };
  if (supabase) {
    const { data: res, error } = await supabase.from('aa_summary').upsert(record, { onConflict: 'msme_id,month' });
    if (error) throw error;
    return res;
  }
  return mockDb.upsert('aa_summary', record, 'month');
}

export async function saveEpfoSummary(msmeId: string, month: string, data: any) {
  const record = { msme_id: msmeId, month, ...data };
  if (supabase) {
    const { data: res, error } = await supabase.from('epfo_summary').upsert(record, { onConflict: 'msme_id,month' });
    if (error) throw error;
    return res;
  }
  return mockDb.upsert('epfo_summary', record, 'month');
}

export async function createMsme(userId: string, businessName: string, gstin: string) {
  if (supabase) {
    const { data: existing } = await supabase.from('msmes').select('*').eq('gstin', gstin).maybeSingle();
    if (existing) return existing;
    const record = { user_id: userId, business_name: businessName, gstin, consent_granted: false };
    const { data, error } = await supabase.from('msmes').insert(record).select().single();
    if (error) throw error;
    return data;
  } else {
    const list = await mockDb.select('msmes', { gstin });
    if (list.length > 0) return list[0];
    const record = { user_id: userId, business_name: businessName, gstin, consent_granted: false };
    return mockDb.insert('msmes', record);
  }
}

export async function grantConsent(msmeId: string) {
  if (supabase) {
    const { data, error } = await supabase.from('msmes').update({
      consent_granted: true,
      consent_date: new Date().toISOString()
    }).eq('id', msmeId).select().single();
    if (error) throw error;
    return data;
  }
  const msmes = await mockDb.select('msmes', { id: msmeId });
  if (msmes.length > 0) {
    msmes[0].consent_granted = true;
    msmes[0].consent_date = new Date().toISOString();
    return msmes[0];
  }
  return null;
}

export async function saveFinancialHealthCard(msmeId: string, cardData: any) {
  const record = { msme_id: msmeId, ...cardData };
  if (supabase) {
    const { data, error } = await supabase.from('financial_health_cards').upsert(record, { onConflict: 'msme_id' }).select().single();
    if (error) throw error;
    return data;
  }
  return mockDb.upsert('financial_health_cards', record, 'msme_id');
}

export async function getFinancialHealthCard(msmeId: string) {
  if (supabase) {
    const { data } = await supabase.from('financial_health_cards').select('*').eq('msme_id', msmeId).single();
    return data;
  }
  const list = await mockDb.select('financial_health_cards', { msme_id: msmeId });
  return list[0] || null;
}

export async function saveRecommendations(msmeId: string, recs: any[]) {
  if (supabase) {
    // Delete old recommendations first
    await supabase.from('recommendations').delete().eq('msme_id', msmeId);
    const { data, error } = await supabase.from('recommendations').insert(
      recs.map(r => ({ msme_id: msmeId, recommendation_text: r.recommendation_text, category: r.category }))
    ).select();
    if (error) throw error;
    return data;
  }
  // Remove old ones in mockDb
  mockDb.store.recommendations = mockDb.store.recommendations.filter((r: any) => r.msme_id !== msmeId);
  const inserted = [];
  for (const r of recs) {
    const ins = await mockDb.insert('recommendations', { msme_id: msmeId, recommendation_text: r.recommendation_text, category: r.category });
    inserted.push(ins);
  }
  return inserted;
}

export async function getRecommendations(msmeId: string) {
  if (supabase) {
    const { data } = await supabase.from('recommendations').select('*').eq('msme_id', msmeId);
    return data || [];
  }
  return mockDb.select('recommendations', { msme_id: msmeId });
}
