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
    const { messages, token, role } = await req.json();

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
    let systemInstruction = '';
    
    if (role === 'admin') {
      systemInstruction = `You are Soko AI, the intelligent assistant for Soko Mtaa — a neighbourhood digital marketplace in Kenya.
You are assisting an ADMIN. You help them monitor market health, manage disputes, and oversee fee collections.

CAPABILITIES:
- Get an overview of market statistics using get_market_health
- Find traders who are behind on fees using get_fee_defaulters
- Summarize open complaints to speed up dispute resolution using summarize_complaints

RULES:
- Be concise, professional, and clear.
- Do not make up metrics or complaints. Only use the data provided by the tools.
- Highlight important numbers (like revenue or high-priority complaints) in bold.`;
    } else if (role === 'trader') {
      systemInstruction = `You are Soko AI, the intelligent assistant for Soko Mtaa — a neighbourhood digital marketplace in Kenya.
You are assisting a TRADER. You help them manage their stall, add products, update stock levels, and analyze their inventory and sales.

CAPABILITIES:
- View categories using get_categories
- Add a new product to their stall using add_product. You are an expert SEO copywriter: if the trader asks to add a product but doesn't provide a description, automatically generate a compelling, market-friendly description (in English or Swahili) before saving.
- Update the stock quantity of an existing product using update_stock
- Analyze their current inventory using analyze_stock
- View sales and revenue insights using get_sales_insights

RULES:
- When adding a product, always fetch categories first to ensure you use the correct category ID.
- Do not make up product IDs; use analyze_stock to find the product ID before updating stock.
- Be concise. Use bullet points for lists. Greet in Swahili occasionally.
- If a tool returns an error, apologize and explain what went wrong.`;
    } else {
      systemInstruction = `You are Soko AI, the intelligent assistant for Soko Mtaa — a neighbourhood digital marketplace in Kenya.
You help residents discover traders, find products, make reservations, and pay via M-Pesa.

CAPABILITIES:
- Search for products in the market using the search_products tool
- Create a reservation for a product on behalf of the user using create_reservation tool
- Initiate an M-Pesa STK push payment using trigger_mpesa_payment tool
- Track the status of a user's reservations using track_reservation

RULES:
- Always search before making a reservation to confirm the product exists
- Recipe to Cart / Price Comparison: If a user asks for a recipe or wants to compare prices, autonomously use the search_products tool multiple times (if needed) to find the best or cheapest ingredients, then offer to reserve them.
- Only create reservations when the user explicitly confirms they want to reserve
- Before triggering M-Pesa, confirm the amount and phone number with the user
- Be concise. Use bullet points for product lists. Greet in Swahili occasionally.
- Never make up product names, prices, or stall numbers — only use data from tool results.
- If a tool returns an error, apologize and explain what went wrong.`;
    }

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

      track_reservation: tool({
        description: 'Fetches the resident\'s most recent reservations to check their status.',
        parameters: z.object({}),
        // @ts-expect-error - AI SDK v6 strict type inference workaround
        execute: async () => {
          if (!token) return { error: 'You must be logged in.' };
          const res = await laravelFetch('/resident/reservations', token);
          if (!res.ok) return { error: 'Failed to fetch reservations.' };
          const data = await res.json();
          const reservations = data.data?.data || data.data || [];
          if (!reservations.length) return { message: 'You have no recent reservations.' };
          
          return {
            reservations: reservations.slice(0, 5).map((r: any) => ({
              reservation_code: r.reservation_code,
              product: r.product?.name,
              quantity: r.quantity,
              total_amount: r.total_amount,
              status: r.status,
              trader: r.trader?.business_name,
            })),
          };
        },
      }),

      // ── TRADER TOOLS ────────────────────────────────────────────────────────
      get_sales_insights: tool({
        description: 'Fetches the trader\'s dashboard statistics to report on revenue, pending reservations, and active products.',
        parameters: z.object({}),
        // @ts-expect-error - AI SDK v6 strict type inference workaround
        execute: async () => {
          if (!token) return { error: 'You must be logged in as a trader.' };
          const res = await laravelFetch('/trader/stats', token);
          if (!res.ok) return { error: 'Failed to fetch sales insights.' };
          const data = await res.json();
          return { stats: data.data || data };
        },
      }),
      analyze_stock: tool({
        description: 'Fetches the trader\'s products and returns an analysis of their stock levels, including out-of-stock and low-stock items.',
        parameters: z.object({}),
        // @ts-expect-error - AI SDK v6 strict type inference workaround
        execute: async () => {
          if (!token) return { error: 'You must be logged in as a trader.' };
          const res = await laravelFetch('/trader/products', token);
          if (!res.ok) return { error: 'Failed to fetch inventory data.' };
          const data = await res.json();
          const products = data.data?.data || data.data || [];
          
          if (!products.length) return { message: 'Your inventory is currently empty.' };

          const total = products.length;
          const outOfStock = products.filter((p: any) => p.stock_status === 'out_of_stock' || p.stock_quantity === 0);
          const lowStock = products.filter((p: any) => p.stock_status === 'low' || (p.stock_quantity > 0 && p.stock_quantity <= 5));
          const available = products.filter((p: any) => p.stock_status === 'available');

          return {
            total_products: total,
            out_of_stock: outOfStock.map((p: any) => ({ id: p.id, name: p.name, stock: p.stock_quantity })),
            low_stock: lowStock.map((p: any) => ({ id: p.id, name: p.name, stock: p.stock_quantity })),
            available_count: available.length,
          };
        },
      }),

      get_categories: tool({
        description: 'Fetches a list of available product categories. Use this to find the correct category_id before adding a product.',
        parameters: z.object({}),
        // @ts-expect-error - AI SDK v6 strict type inference workaround
        execute: async () => {
          const res = await fetch(`${apiUrl}/categories`, { headers: { 'Accept': 'application/json' } });
          if (!res.ok) return { error: 'Failed to fetch categories.' };
          const data = await res.json();
          return { categories: data.data || data };
        },
      }),

      add_product: tool({
        description: 'Adds a new product to the trader\'s stall.',
        parameters: z.object({
          name: z.string().describe('The name of the product'),
          category_id: z.number().describe('The ID of the category (use get_categories to find this first)'),
          price: z.number().describe('The price of the product in KES'),
          stock_quantity: z.number().describe('The initial stock quantity available'),
          unit: z.string().describe('The unit of measurement (e.g., "kg", "piece", "bunch", "litre")'),
          description: z.string().optional().describe('A brief description of the product'),
        }),
        // @ts-expect-error - AI SDK v6 strict type inference workaround
        execute: async (payload: { name: string; category_id: number; price: number; stock_quantity: number; unit: string; description?: string }) => {
          if (!token) return { error: 'You must be logged in as a trader.' };
          const res = await laravelFetch('/trader/products', token, {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!res.ok) return { error: data.message ?? 'Failed to add product. Make sure your trader profile is complete.' };
          return {
            success: true,
            message: 'Product added successfully.',
            product: data.data || data,
          };
        },
      }),

      update_stock: tool({
        description: 'Updates the stock quantity of an existing product.',
        parameters: z.object({
          product_id: z.number().describe('The ID of the product to update (use analyze_stock to find this)'),
          stock_quantity: z.number().describe('The new stock quantity'),
        }),
        // @ts-expect-error - AI SDK v6 strict type inference workaround
        execute: async ({ product_id, stock_quantity }: { product_id: number; stock_quantity: number }) => {
          if (!token) return { error: 'You must be logged in as a trader.' };
          
          // First, get the product so we don't overwrite other required fields
          const getRes = await laravelFetch(`/trader/products/${product_id}`, token);
          if (!getRes.ok) return { error: 'Product not found.' };
          const productData = await getRes.json();
          const p = productData.data || productData;

          // Then update it via PUT
          const payload = {
            name: p.name,
            category_id: p.category_id,
            price: p.price,
            unit: p.unit,
            stock_quantity: stock_quantity,
          };

          const res = await laravelFetch(`/trader/products/${product_id}`, token, {
            method: 'PUT',
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!res.ok) return { error: data.message ?? 'Failed to update stock.' };
          return {
            success: true,
            message: `Stock for product ID ${product_id} updated to ${stock_quantity}.`,
          };
        },
      }),

      // ── ADMIN TOOLS ─────────────────────────────────────────────────────────
      get_market_health: tool({
        description: 'Fetches overall system statistics for the admin dashboard.',
        parameters: z.object({}),
        // @ts-expect-error - AI SDK v6 strict type inference workaround
        execute: async () => {
          if (!token) return { error: 'You must be logged in as an admin.' };
          const res = await laravelFetch('/admin/stats', token);
          if (!res.ok) return { error: 'Failed to fetch market stats.' };
          const data = await res.json();
          return { market_health: data.data || data };
        },
      }),

      get_fee_defaulters: tool({
        description: 'Fetches a list of traders who are delinquent on their market fees.',
        parameters: z.object({}),
        // @ts-expect-error - AI SDK v6 strict type inference workaround
        execute: async () => {
          if (!token) return { error: 'You must be logged in as an admin.' };
          const res = await laravelFetch('/admin/fees/delinquents', token);
          if (!res.ok) return { error: 'Failed to fetch fee defaulters.' };
          const data = await res.json();
          const defaulters = data.data?.data || data.data || [];
          if (!defaulters.length) return { message: 'No traders are currently delinquent.' };
          return {
            defaulters: defaulters.map((d: any) => ({
              trader: d.business_name,
              stall: d.stall?.stall_number,
              details: d,
            })).slice(0, 10),
          };
        },
      }),

      summarize_complaints: tool({
        description: 'Fetches the latest open complaints to summarize for the admin.',
        parameters: z.object({}),
        // @ts-expect-error - AI SDK v6 strict type inference workaround
        execute: async () => {
          if (!token) return { error: 'You must be logged in as an admin.' };
          const res = await laravelFetch('/complaints?status=open', token);
          if (!res.ok) return { error: 'Failed to fetch complaints.' };
          const data = await res.json();
          const complaints = data.data?.data || data.data || [];
          if (!complaints.length) return { message: 'There are no open complaints right now.' };
          
          return {
            complaints: complaints.slice(0, 5).map((c: any) => ({
              id: c.id,
              subject: c.subject,
              description: c.description,
              priority: c.priority,
              category: c.category,
            })),
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
