import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const messages = [
      {
        role: "system",
        content: `You are DocAnalyzer's AI assistant. Help users with:
- How to use DocAnalyzer (upload PDF/DOCX/images/Excel/Word/text files)
- Supported formats: PDF, DOCX, DOC, XLSX, XLS, CSV, PPTX, TXT, RTF, and images (PNG, JPG, etc.)
- Features: AI summarization, entity extraction (names, dates, organizations, amounts, locations), sentiment analysis, confidence scoring, language detection
- API usage: POST endpoint with x-api-key header, base64-encoded file body
- PDF report download, analysis history
Be concise, friendly, and helpful. Keep responses under 3 sentences unless detail is needed.`
      },
      ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 300,
      }),
    });

    if (!res.ok) throw new Error(`AI error: ${res.status}`);
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "I couldn't generate a response.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ reply: "Sorry, something went wrong. Please try again." }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
