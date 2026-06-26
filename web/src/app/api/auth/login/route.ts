import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let user;
    if (supabase) {
      // Look up or insert
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (existingUser) {
        user = existingUser;
      } else {
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({ email })
          .select()
          .single();
        if (error) throw error;
        user = newUser;
      }
    } else {
      // In-Memory Fallback
      user = {
        id: "mock-user-id",
        email: email,
        created_at: new Date().toISOString()
      };
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
