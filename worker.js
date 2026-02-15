
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const PASSWORD = "owami";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // Allow all origins for simplicity, relying on password for security
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function handleRequest(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: CORS_HEADERS
    });
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader || authHeader !== `Bearer ${PASSWORD}`) {
    return new Response("Unauthorized", { status: 401, headers: CORS_HEADERS });
  }

  try {
    const url = new URL(request.url);

    if (request.method === "GET") {
      // Fetch data from KV
      // Assuming SUB_KV is bound to the worker environment
      let data = await SUB_KV.get("dashboard_data");

      if (!data) {
        // Initialize with empty structure if not found
        data = JSON.stringify({
          websites: [],
          cloudflare: [],
          ideas: [],
          facts: []
        });
      }

      return new Response(data, {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS }
      });
    }

    else if (request.method === "POST") {
      const body = await request.json();

      // Basic validation: ensure expected keys exist
      const newData = {
        websites: body.websites || [],
        cloudflare: body.cloudflare || [],
        ideas: body.ideas || [],
        facts: body.facts || []
      };

      // Save to KV
      await SUB_KV.put("dashboard_data", JSON.stringify(newData));

      return new Response(JSON.stringify({ success: true, message: "Data saved successfully" }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS }
      });
    }

    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS_HEADERS });
  }
}
