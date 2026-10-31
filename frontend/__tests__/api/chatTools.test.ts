/**
 * @jest-environment node
 *
 * Contract test for the Soko AI tool endpoints.
 *
 * Every tool in `app/api/chat/route.ts` calls a Laravel route. Four of them
 * previously pointed at routes that were never registered (`/trader/products`,
 * `/resident/reservations`), so the model received `{ error: ... }` for every
 * data request and told users it could not reach the database.
 *
 * These assertions pin each tool to the endpoint Laravel actually exposes.
 */

jest.mock('ai', () => ({
  generateText: jest.fn(),
  tool: (config: unknown) => config,
  stepCountIs: jest.fn(() => () => false),
  jsonSchema: (schema: unknown) => schema,
}));

jest.mock('@ai-sdk/groq', () => ({
  createGroq: () => (modelId: string) => ({ modelId }),
}));

jest.mock('@ai-sdk/openai', () => ({
  createOpenAI: () => ({ chat: (modelId: string) => ({ modelId }) }),
}));

import { POST } from '@/app/api/chat/route';
import { generateText } from 'ai';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTool = { execute: (...args: any[]) => Promise<any> };

describe('Soko AI tool endpoints', () => {
  let tools: Record<string, AnyTool>;
  let requestLog: { url: string; method: string }[];
  // Lets a single test answer with an error body instead of the default OK.
  let override: (() => Response | null) | null = null;

  const originalFetch = global.fetch;

  beforeAll(async () => {
    process.env.API_URL = 'https://api.example.test/api';

    requestLog = [];
    global.fetch = jest.fn(async (input: unknown, init: RequestInit = {}) => {
      const url = String(input);
      requestLog.push({ url, method: (init.method ?? 'GET').toUpperCase() });

      const overridden = override?.();
      if (overridden) return overridden;

      if (url.includes('/internal/ai-config')) {
        return new Response(
          JSON.stringify({
            status: 'success',
            data: {
              provider: 'groq',
              model: 'llama-3.3-70b-versatile',
              groq_api_key: 'gsk_test',
              openai_api_key: '',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Default: an empty but well-formed Laravel ApiResponse.
      return new Response(
        JSON.stringify({ success: true, message: 'ok', data: { data: [] } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }) as unknown as typeof fetch;

    (generateText as jest.Mock).mockResolvedValue({ text: 'ok' });

    const res = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'hello' }],
          token: 'test-token',
          role: 'trader',
        }),
      })
    );

    expect(res.status).toBe(200);

    const call = (generateText as jest.Mock).mock.calls[0][0];
    tools = call.tools;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  function lastRequest() {
    return requestLog[requestLog.length - 1];
  }

  it('exposes every expected tool', () => {
    expect(Object.keys(tools).sort()).toEqual(
      [
        'add_product',
        'add_to_cart',
        'analyze_stock',
        'create_reservation',
        'find_nearby_traders',
        'get_categories',
        'get_fee_defaulters',
        'get_featured_traders',
        'get_market_health',
        'get_sales_insights',
        'get_trader_products',
        'search_products',
        'search_traders',
        'summarize_complaints',
        'track_reservation',
        'trigger_mpesa_payment',
        'update_stock',
      ].sort()
    );
  });

  it('analyze_stock reads the trader inventory from /products', async () => {
    await tools.analyze_stock.execute({}, {});

    expect(lastRequest()).toEqual({
      url: 'https://api.example.test/api/products',
      method: 'GET',
    });
  });

  it('add_product posts to /products', async () => {
    await tools.add_product.execute(
      {
        name: 'Sukuma Wiki',
        category_id: 1,
        price: 50,
        stock_quantity: 10,
        unit: 'bunch',
        description: '',
      },
      {}
    );

    expect(lastRequest()).toEqual({
      url: 'https://api.example.test/api/products',
      method: 'POST',
    });
  });

  it('update_stock reads then updates /products/{id}', async () => {
    await tools.update_stock.execute({ product_id: 42, stock_quantity: 7 }, {});

    const productCalls = requestLog.filter((r) =>
      r.url.endsWith('/api/products/42')
    );
    expect(productCalls.map((c) => c.method)).toEqual(['GET', 'PUT']);
  });

  it('track_reservation reads the resident reservation list from /reservations', async () => {
    await tools.track_reservation.execute({}, {});

    expect(lastRequest()).toEqual({
      url: 'https://api.example.test/api/reservations',
      method: 'GET',
    });
  });

  it('get_sales_insights reads /trader/stats', async () => {
    await tools.get_sales_insights.execute({}, {});

    expect(lastRequest()).toEqual({
      url: 'https://api.example.test/api/trader/stats',
      method: 'GET',
    });
  });

  it('get_market_health reads /admin/stats', async () => {
    await tools.get_market_health.execute({}, {});

    expect(lastRequest()).toEqual({
      url: 'https://api.example.test/api/admin/stats',
      method: 'GET',
    });
  });

  it('get_fee_defaulters reads /admin/fees/delinquents', async () => {
    await tools.get_fee_defaulters.execute({}, {});

    expect(lastRequest()).toEqual({
      url: 'https://api.example.test/api/admin/fees/delinquents',
      method: 'GET',
    });
  });

  it('summarize_complaints reads /complaints', async () => {
    await tools.summarize_complaints.execute({}, {});

    expect(lastRequest().url).toContain('/api/complaints');
  });

  it('create_reservation posts to /reservations', async () => {
    await tools.create_reservation.execute(
      { product_id: 1, quantity: 1, notes: '' },
      {}
    );

    expect(lastRequest()).toEqual({
      url: 'https://api.example.test/api/reservations',
      method: 'POST',
    });
  });

  it('never targets the unregistered /trader/* or /resident/* product paths', async () => {
    await tools.analyze_stock.execute({}, {});
    await tools.add_product.execute(
      {
        name: 'x',
        category_id: 1,
        price: 1,
        stock_quantity: 1,
        unit: 'kg',
        description: '',
      },
      {}
    );
    await tools.update_stock.execute({ product_id: 1, stock_quantity: 1 }, {});
    await tools.track_reservation.execute({}, {});

    const offending = requestLog.filter(
      (r) =>
        r.url.includes('/trader/products') ||
        r.url.includes('/resident/reservations')
    );

    expect(offending).toEqual([]);
  });

  it('trigger_mpesa_payment posts the reservation and phone to /payments/mpesa/stkpush', async () => {
    override = null;

    const result = await tools.trigger_mpesa_payment.execute(
      { reservation_id: 23, phone_number: '0743394373' },
      {}
    );

    const req = lastRequest();
    expect(req.url).toBe('https://api.example.test/api/payments/mpesa/stkpush');
    expect(req.method).toBe('POST');
    expect(result.success).toBe(true);
  });

  it('trigger_mpesa_payment surfaces the backend message instead of throwing', async () => {
    override = () =>
      new Response(
        JSON.stringify({
          success: false,
          message: 'These reservations were not found or do not belong to you.',
          code: 'RESERVATION_NOT_FOUND',
        }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );

    const result = await tools.trigger_mpesa_payment.execute(
      { reservation_id: 99999, phone_number: '0743394373' },
      {}
    );

    expect(result.success).toBeUndefined();
    expect(result.error).toContain('not found');
  });

  it('trigger_mpesa_payment survives a non-JSON error page', async () => {
    override = () =>
      new Response('<html><body>Server Error</body></html>', {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      });

    const result = await tools.trigger_mpesa_payment.execute(
      { reservation_id: 23, phone_number: '0743394373' },
      {}
    );

    expect(result.success).toBeUndefined();
    expect(result.error).toMatch(/HTTP 500/);
  });

  it('trigger_mpesa_payment refuses to run without a reservation id', async () => {
    override = null;
    requestLog.length = 0;

    const result = await tools.trigger_mpesa_payment.execute(
      { phone_number: '0743394373' },
      {}
    );

    expect(result.error).toMatch(/No reservation/);
    expect(requestLog).toEqual([]);
  });
});

describe('Soko AI conversation context', () => {
  const originalFetch = global.fetch;
  let requestLog: string[] = [];

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('gives residents their pending reservation ids in the prompt', async () => {
    process.env.API_URL = 'https://api.example.test/api';
    requestLog = [];

    global.fetch = jest.fn(async (input: unknown) => {
      const url = String(input);
      requestLog.push(url);

      if (url.includes('/internal/ai-config')) {
        return new Response(
          JSON.stringify({
            data: {
              provider: 'groq',
              model: 'llama-3.3-70b-versatile',
              groq_api_key: 'gsk_test',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (url.includes('/reservations?status=pending')) {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              data: [
                {
                  id: 23,
                  reservation_code: 'SM-GIYOSC',
                  quantity: 1,
                  total_amount: '20.00',
                  product: { name: 'Sukuma Wiki' },
                },
              ],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (url.includes('/products/7/public')) {
        return new Response(
          JSON.stringify({
            success: true,
            data: { id: 7, name: 'Sukuma Wiki', price: '20.00', active_price: '20.00' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({ success: true, data: { data: [] } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as unknown as typeof fetch;

    (generateText as jest.Mock).mockResolvedValue({ text: 'ok' });

    const res = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: '0743394373' }],
          token: 'test-token',
          role: 'resident',
        }),
      })
    );

    expect(res.status).toBe(200);
    expect(requestLog.some((u) => u.includes('/reservations?status=pending'))).toBe(true);

    const call = (generateText as jest.Mock).mock.calls.at(-1)?.[0];
    expect(call.system).toContain('reservation_id=23');
    expect(call.system).toContain('Sukuma Wiki');
  });

  it('add_to_cart fills the cart from the public product route', async () => {
    const tools = (generateText as jest.Mock).mock.calls.at(-1)?.[0].tools;

    const result = await tools.add_to_cart.execute({ product_id: 7, quantity: 2 }, {});

    expect(requestLog).toContain('https://api.example.test/api/products/7/public');
    expect(result.product?.name).toBe('Sukuma Wiki');
    expect(result.quantity).toBe(2);
  });

  it('returns the side effects of a turn so the UI can replay them', async () => {
    (generateText as jest.Mock).mockResolvedValueOnce({
      text: 'Done.',
      steps: [
        {
          toolResults: [
            {
              toolName: 'add_to_cart',
              output: { success: true, product: { id: 7, name: 'Sukuma Wiki' }, quantity: 2 },
            },
            // A failed tool must not reach the UI as if it had worked.
            { toolName: 'add_to_cart', output: { error: 'Product 99 could not be found.' } },
            {
              toolName: 'create_reservation',
              output: {
                success: true,
                reservation_id: 23,
                reservation_code: 'SM-GIYOSC',
                total_amount: '20.00',
              },
            },
            { toolName: 'trigger_mpesa_payment', output: { success: true, reservation_id: 23 } },
            { toolName: 'search_products', output: { products: [] } },
          ],
        },
      ],
    });

    const res = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'add 2 sukuma to my cart' }],
          token: 'test-token',
          role: 'resident',
        }),
      })
    );

    const body = await res.json();

    expect(body.actions).toEqual([
      { type: 'cart_add', product: { id: 7, name: 'Sukuma Wiki' }, quantity: 2 },
      { type: 'reservation_created', reservation_id: 23, reservation_code: 'SM-GIYOSC', total_amount: '20.00' },
      { type: 'payment_initiated', reservation_id: 23 },
    ]);
  });
});
