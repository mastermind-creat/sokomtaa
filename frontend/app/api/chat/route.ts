import { generateText, tool, stepCountIs } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

export const maxDuration = 30;

// ── Helper: call Laravel API with user token ──────────────────────────────────
async function laravelFetch(path: string, token: string, options: RequestInit = {}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  return fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
}

export async function POST(req: Request) {
  try {
    const { messages, token } = await req.json();

    // ── Fetch AI config securely (server-to-server) ───────────────────────────
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const internalSecret = process.env.INTERNAL_API_SECRET || '';

    const configRes = await fetch(`${apiUrl}/internal/ai-config`, {
      method: 'GET',
      headers: { 'X-Internal-Secret': internalSecret, 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!configRes.ok) {
      return Response.json({ error: 'AI configuration unavailable' }, { status: 500 });
    }

    const { data: aiConfig } = await configRes.json();

    let model;
    if (aiConfig.provider === 'openai') {
      if (!aiConfig.openai_api_key) {
        return Response.json({ error: 'OpenAI API key not configured in Admin → Settings → AI' }, { status: 500 });
      }
      const openai = createOpenAI({ apiKey: aiConfig.openai_api_key });
      model = openai(aiConfig.model || 'gpt-4o');
    } else {
      if (!aiConfig.groq_api_key) {
        return Response.json({ error: 'Groq API key not configured. Go to Admin → Settings → AI to add it.' }, { status: 500 });
      }
      const groq = createGroq({ apiKey: aiConfig.groq_api_key });
      model = groq(aiConfig.model || 'llama-3.3-70b-versatile');
    }

    // ── System prompt ─────────────────────────────────────────────────────────
    const systemInstruction = `You are Soko AI, the intelligent assistant for Soko Mtaa — a neighbourhood digital marketplace in Kenya.
You help residents discover traders, find products, make reservations, and pay via M-Pesa.

CAPABILITIES:
- Search for products in the market using the search_products tool
- Create a reservation for a product on behalf of the user using create_reservation tool
- Initiate an M-Pesa STK push payment using trigger_mpesa_payment tool

RULES:
- Always search before making a reservation to confirm the product exists
- Only create reservations when the user explicitly confirms they want to reserve
- Before triggering M-Pesa, confirm the amount and phone number with the user
- Be concise. Use bullet points for product lists. Greet in Swahili occasionally.
- Never make up product names, prices, or stall numbers — only use data from tool results.
- If a tool returns an error, apologize and explain what went wrong.`;

    // Build history prompt
    const historyPrompt = (messages as { role: string; content: string }[])
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    // ── Agentic Tools ─────────────────────────────────────────────────────────
    const tools = {
      search_products: tool({
        description: 'Search for products available in the market by keyword. Returns a list of matching products with prices, stock status, and trader info.',
        parameters: z.object({
          query: z.string().describe('The product or item to search for, e.g. "sukuma wiki", "tomatoes", "maize flour"'),
          category: z.string().optional().describe('Optional category filter, e.g. "vegetables", "grains"'),
        }),
        // @ts-expect-error - AI SDK v6 strict type inference workaround
        execute: async ({ query, category }: { query: string; category?: string }) => {
          const params = new URLSearchParams({ search: query });
          if (category) params.append('category', category);
          const res = await fetch(`${apiUrl}/search?${params}`, {
            headers: { 'Accept': 'application/json' },
          });
          if (!res.ok) return { error: 'Search failed. Please try again.' };
          const data = await res.json();
          const products = (data.data ?? data).slice(0, 5);
          if (!products.length) return { message: `No products found for "${query}".` };
          return {
            results: products.map((p: Record<string, unknown>) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              unit: p.unit,
              stock_status: p.stock_status,
              trader: (p.trader as Record<string, unknown>)?.business_name ?? 'Unknown',
              trader_id: (p.trader as Record<string, unknown>)?.id,
            })),
          };
        },
      }),

      create_reservation: tool({
        description: 'Create a reservation for a product on behalf of the user. The user must be authenticated.',
        parameters: z.object({
          product_id: z.number().describe('The ID of the product to reserve'),
          quantity: z.number().min(1).describe('Number of units to reserve'),
          notes: z.string().optional().describe('Optional pickup notes from the user'),
        }),
        // @ts-expect-error - AI SDK v6 strict type inference workaround
        execute: async ({ product_id, quantity, notes }: { product_id: number; quantity: number; notes?: string }) => {
          if (!token) return { error: 'You must be logged in to make a reservation.' };
          const res = await laravelFetch('/reservations', token, {
            method: 'POST',
            body: JSON.stringify({ product_id, quantity, notes }),
          });
          const data = await res.json();
          if (!res.ok) return { error: data.message ?? 'Reservation failed.' };
          return {
            success: true,
            reservation_code: data.data?.reservation_code ?? data.reservation_code,
            total_amount: data.data?.total_amount ?? data.total_amount,
            message: 'Reservation created successfully! Proceed to pay via M-Pesa.',
          };
        },
      }),

      trigger_mpesa_payment: tool({
        description: 'Initiates an M-Pesa STK push to the user\'s phone to pay for a reservation. The user will receive a PIN prompt on their phone.',
        parameters: z.object({
          reservation_id: z.number().describe('The reservation ID to pay for'),
          phone_number: z.string().describe('Kenyan phone number to send STK push to, e.g. 0712345678'),
        }),
        // @ts-expect-error - AI SDK v6 strict type inference workaround
        execute: async ({ reservation_id, phone_number }: { reservation_id: number; phone_number: string }) => {
          if (!token) return { error: 'You must be logged in to make a payment.' };
          const res = await laravelFetch(`/reservations/${reservation_id}/pay`, token, {
            method: 'POST',
            body: JSON.stringify({ phone_number }),
          });
          const data = await res.json();
          if (!res.ok) return { error: data.message ?? 'Payment initiation failed.' };
          return {
            success: true,
            message: `M-Pesa STK push sent to ${phone_number}. Please enter your PIN on your phone to complete payment.`,
            checkout_request_id: data.data?.checkout_request_id,
          };
        },
      }),
    };

    // ── Run generation with tool calling ─────────────────────────────────────
    const result = await generateText({
      model,
      system: systemInstruction,
      prompt: historyPrompt,
      tools,
      stopWhen: stepCountIs(5), // Allow up to 5 tool-call cycles (search → reserve → pay)
    });

    return Response.json({ response: result.text });
  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: `AI service error: ${msg}` }, { status: 500 });
  }
}
