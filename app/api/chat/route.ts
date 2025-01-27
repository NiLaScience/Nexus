import { OpenAI } from 'openai';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Generate response using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const message = completion.choices[0]?.message?.content;

    if (!message) {
      throw new Error('No response generated');
    }

    // Add message to ticket_messages if this is part of a ticket conversation
    const supabase = await createClient();
    const ticketId = req.headers.get('x-ticket-id');

    if (ticketId) {
      await supabase.from('ticket_messages').insert({
        ticket_id: ticketId,
        content: message,
        source: 'ai',
      });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
} 