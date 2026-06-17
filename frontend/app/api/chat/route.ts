import { generateText, tool, stepCountIs, jsonSchema } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';

export const maxDuration = 30;

// ── Helper: call Laravel API with user token ──────────────────────────────────
async function laravelFetch(path: string, token: string, options: RequestInit = {}) {
  // Use server-side API_URL for route handlers; it resolves 127.0.0.1 reliably
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
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
    // Use server-side API_URL for route handlers; it resolves 127.0.0.1 reliably
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
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
      // Use .chat() to force /v1/chat/completions — the newer Responses API
      // in @ai-sdk/openai v3 has a schema serialization issue (type: null).
      model = openai.chat(aiConfig.model || 'gpt-4o-mini');
    } else {
      if (!aiConfig.groq_api_key) {
        return Response.json({ error: 'Groq API key not configured. Go to Admin → Settings → AI to add it.' }, { status: 500 });
      }
      const groq = createGroq({ apiKey: aiConfig.groq_api_key });
      model = groq(aiConfig.model || 'llama-3.3-70b-versatile');
    }

    // Fetch user location if authenticated
    let userLocation: { lat: number; lng: number } | null = null;
    if (token) {
      try {
        if (role === 'trader') {
          const profileRes = await laravelFetch('/trader/me', token);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            const trader = profileData.data || profileData;
            if (trader.latitude && trader.longitude) {
              userLocation = {
                lat: parseFloat(trader.latitude),
                lng: parseFloat(trader.longitude),
              };
            }
          }
        } else {
          const profileRes = await laravelFetch('/profile', token);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            const user = profileData.data || profileData;
            if (user.default_delivery_latitude && user.default_delivery_longitude) {
              userLocation = {
                lat: parseFloat(user.default_delivery_latitude),
                lng: parseFloat(user.default_delivery_longitude),
              };
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch user location:', err);
      }
    }

    // ── System prompt ─────────────────────────────────────────────────────────
    const systemInstruction = `You are Soko AI, the intelligent assistant for Soko Mtaa — a neighbourhood digital marketplace in Kenya.
You have full access to all resident, trader, and admin capabilities. Assist the user based on their context and role (${role || 'resident'}), but feel free to utilize any tool if relevant.

LANGUAGE & INTERACTION RULES:
- Use English as your default language for all responses.
- Only speak or respond in Swahili if the user explicitly initiates in Swahili or requests Swahili.
- Keep your answers concise, professional, and directly actionable.
- Never make up information (products, ratings, fees, or complaints) — only use real data returned by the tools.
- If a tool returns an error, apologize and explain what went wrong.

CAPABILITIES:
1. Resident:
   - Discover traders using get_featured_traders or search_traders.
   - Search for products using search_products.
   - Create reservations using create_reservation.
   - Initiate M-Pesa payments using trigger_mpesa_payment.
   - Track reservations using track_reservation.
2. Trader:
   - View sales/revenue insights using get_sales_insights.
   - Analyze inventory/stock levels using analyze_stock.
   - View categories using get_categories.
   - Add new products using add_product. (If adding a product without a description, generate a compelling SEO description in English).
   - Update stock levels using update_stock.
3. Admin:
   - Monitor market statistics/health using get_market_health.
   - Retrieve delinquent fee records using get_fee_defaulters.
   - Summarize open disputes/complaints using summarize_complaints.`;

    // Build history prompt
    const historyPrompt = (messages as { role: string; content: string }[])
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    // ── Agentic Tools ─────────────────────────────────────────────────────────
    const tools = {
      get_featured_traders: tool({
        description: 'Get a list of featured or top-rated verified traders in the market, ordered by their total reviews.',
        inputSchema: jsonSchema<Record<string, never>>({
          type: 'object',
          properties: {},
          required: [],
        }),
        // @ts-expect-error - AI SDK v6 strict type inference workaround
        execute: async () => {
          const res = await fetch(`${apiUrl}/traders/featured`, {
            headers: { 'Accept': 'application/json' },
          });
          if (!res.ok) return { error: 'Failed to fetch featured traders.' };
          const data = await res.json();
          const traders = data.data || data;
          return { traders: Array.isArray(traders) ? traders : [] };
        },
      }),

      search_traders: tool({
        description: 'Search for traders in the marketplace by business name or swahili business name query.',
        inputSchema: jsonSchema<{ query: string }>({
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The search query for the business name' },
          },
          required: ['query'],
        }),
        // @ts-expect-error - AI SDK v6 strict type inference workaround
        execute: async ({ query }: { query: string }) => {
          const params = new URLSearchParams({ q: query });
          if (userLocation) {
            params.append('lat', String(userLocation.lat));
            params.append('lng', String(userLocation.lng));
          }
          const res = await fetch(`${apiUrl}/traders/search?${params}`, {
            headers: { 'Accept': 'application/json' },
          });
          if (!res.ok) return { error: 'Failed to search traders.' };
          const data = await res.json();
          const traders = data.data?.data || data.data || [];
          return {
            results: traders.map((t: any) => ({
              id: t.id,
              business_name: t.business_name,
              business_name_sw: t.business_name_sw,
              description: t.description,
              rating: t.average_rating,
              reviews_count: t.total_reviews,
              market: t.market?.name,
              stall: t.stall?.stall_number,
            })),
          };
        },
      }),

      search_products: tool({
        description: 'Search for products available in the market by keyword. Returns a list of matching products with prices, stock status, and trader info.',
        inputSchema: jsonSchema<{ query: string; category: string | null }>({
          type: 'object',
          properties: {
            query:    { type: 'string', description: 'The product or item to search for, e.g. "sukuma wiki", "tomatoes", "maize flour"' },
            category: { type: 'string', description: 'Optional category filter, e.g. "vegetables", "grains". Pass empty string to skip.' },
          },
          required: ['query', 'category'],
        }),
        // @ts-expect-error - AI SDK v6 strict type inference workaround
        execute: async ({ query, category }: { query: string; category: string | null }) => {
          const params = new URLSearchParams({ q: query });
          if (category) params.append('category', category);
          if (userLocation) {
            params.append('lat', String(userLocation.lat));
            params.append('lng', String(userLocation.lng));
          }
          const res = await fetch(`${apiUrl}/search?${params}`, {
            headers: { 'Accept': 'application/json' },
          });
          if (!res.ok) return { error: 'Search failed. Please try again.' };
          const data = await res.json();
          const results = data.data?.results || data.results || [];
          const products = results.filter((item: any) => item.search_type === 'product').slice(0, 5);
          if (!products.length) return { message: `No products found for "${query}".` };
          return {
            results: products.map((p: any) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              unit: p.unit,
              stock_status: p.stock_status,
              trader: p.trader?.business_name ?? 'Unknown',
              trader_id: p.trader?.id,
            })),
          };
        },
      }),

      create_reservation: tool({
        description: 'Create a reservation for a product on behalf of the user. The user must be authenticated.',
        inputSchema: jsonSchema<{ product_id: number; quantity: number; notes: string }>({
          type: 'object',
          properties: {
            product_id: { type: 'number', description: 'The ID of the product to reserve' },
            quantity:   { type: 'number', description: 'Number of units to reserve (minimum 1)' },
            notes:      { type: 'string', description: 'Optional pickup notes from the user. Pass empty string if none.' },
          },
          required: ['product_id', 'quantity', 'notes'],
        }),
        // @ts-expect-error - AI SDK v6 strict type inference workaround
        execute: async ({ product_id, quantity, notes }: { product_id: number; quantity: number; notes?: string | null }) => {
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
        inputSchema: jsonSchema<{ reservation_id: number; phone_number: string }>({
          type: 'object',
          properties: {
            reservation_id: { type: 'number', description: 'The reservation ID to pay for' },
            phone_number:   { type: 'string', description: 'Kenyan phone number to send STK push to, e.g. 0712345678' },
          },
          required: ['reservation_id', 'phone_number'],
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
        inputSchema: jsonSchema<Record<string, never>>({
          type: 'object',
          properties: {},
          required: [],
        }),
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

      get_sales_insights: tool({
        description: 'Fetches the trader\'s dashboard statistics to report on revenue, pending reservations, and active products.',
        inputSchema: jsonSchema<Record<string, never>>({
          type: 'object',
          properties: {},
          required: [],
        }),
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
        inputSchema: jsonSchema<Record<string, never>>({
          type: 'object',
          properties: {},
          required: [],
        }),
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
        inputSchema: jsonSchema<Record<string, never>>({
          type: 'object',
          properties: {},
          required: [],
        }),
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
        inputSchema: jsonSchema<{ name: string; category_id: number; price: number; stock_quantity: number; unit: string; description: string }>({
          type: 'object',
          properties: {
            name:           { type: 'string', description: 'The name of the product' },
            category_id:    { type: 'number', description: 'The ID of the category (use get_categories to find this first)' },
            price:          { type: 'number', description: 'The price of the product in KES' },
            stock_quantity: { type: 'number', description: 'The initial stock quantity available' },
            unit:           { type: 'string', description: 'The unit of measurement (e.g., "kg", "piece", "bunch", "litre")' },
            description:    { type: 'string', description: 'A brief description of the product. Pass empty string to auto-generate.' },
          },
          required: ['name', 'category_id', 'price', 'stock_quantity', 'unit', 'description'],
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
        inputSchema: jsonSchema<{ product_id: number; stock_quantity: number }>({
          type: 'object',
          properties: {
            product_id:     { type: 'number', description: 'The ID of the product to update (use analyze_stock to find this)' },
            stock_quantity: { type: 'number', description: 'The new stock quantity' },
          },
          required: ['product_id', 'stock_quantity'],
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
        inputSchema: jsonSchema<Record<string, never>>({
          type: 'object',
          properties: {},
          required: [],
        }),
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
        inputSchema: jsonSchema<Record<string, never>>({
          type: 'object',
          properties: {},
          required: [],
        }),
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
        inputSchema: jsonSchema<Record<string, never>>({
          type: 'object',
          properties: {},
          required: [],
        }),
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
