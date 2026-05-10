export default {
  async fetch(request, env, ctx) {

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    const url = new URL(request.url);

    // ── POST /api/generate ── Gemini API 安全中繼
    if (url.pathname === '/api/generate' && request.method === 'POST') {
      try {
        const { prompt } = await request.json();

        // 基本驗證：prompt 不能是空的
        if (!prompt || typeof prompt !== 'string' || prompt.length < 10) {
          return new Response(JSON.stringify({ error: 'Invalid prompt' }), {
            status: 400,
            headers: corsHeaders()
          });
        }

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
            })
          }
        );

        const data = await res.json();
        return new Response(JSON.stringify(data), {
          headers: corsHeaders()
        });

      } catch (e) {
        return new Response(JSON.stringify({ error: 'Server error' }), {
          status: 500,
          headers: corsHeaders()
        });
      }
    }

    // ── POST /api/verify ── 認證碼驗證（在後端做，前端看不到碼）
    if (url.pathname === '/api/verify' && request.method === 'POST') {
      try {
        const { code } = await request.json();

        if (!code || typeof code !== 'string') {
          return new Response(JSON.stringify({ valid: false }), {
            headers: corsHeaders()
          });
        }

        // CERT_CODES 存在 Cloudflare 環境變數，格式：CODE1,CODE2,CODE3
        const validCodes = (env.CERT_CODES || '')
          .split(',')
          .map(c => c.trim().toUpperCase())
          .filter(Boolean);

        const isValid = validCodes.includes(code.trim().toUpperCase());

        return new Response(JSON.stringify({ valid: isValid }), {
          headers: corsHeaders()
        });

      } catch (e) {
        return new Response(JSON.stringify({ valid: false }), {
          status: 400,
          headers: corsHeaders()
        });
      }
    }

    // Health check
    if (url.pathname === '/') {
      return new Response(JSON.stringify({ status: 'ok', service: 'Aroma Therapist API 🌿' }), {
        headers: corsHeaders()
      });
    }

    return new Response('Not found', { status: 404 });
  }
};

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
