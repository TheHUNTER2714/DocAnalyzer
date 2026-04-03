import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

const API_KEY = "sk_track2_987654321";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey || apiKey !== API_KEY) {
      return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { fileName, fileType, fileBase64 } = await req.json();

    if (!fileName || !fileType || !fileBase64) {
      return new Response(JSON.stringify({ status: "error", message: "Missing required fields: fileName, fileType, fileBase64" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validTypes = ["pdf", "docx", "image", "spreadsheet", "presentation", "text"];
    if (!validTypes.includes(fileType.toLowerCase())) {
      return new Response(JSON.stringify({ status: "error", message: "Invalid fileType. Must be pdf, docx, image, spreadsheet, presentation, or text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode base64 file
    const fileBytes = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));

    // Extract text based on file type
    let extractedText = "";
    const ft = fileType.toLowerCase();

    if (ft === "pdf") {
      extractedText = extractTextFromPDF(fileBytes);
    } else if (ft === "docx") {
      extractedText = await extractTextFromDOCX(fileBytes);
    } else if (ft === "spreadsheet") {
      extractedText = extractTextFromSpreadsheet(fileBytes, fileName);
    } else if (ft === "presentation") {
      extractedText = await extractTextFromPresentation(fileBytes);
    } else if (ft === "text") {
      extractedText = new TextDecoder("utf-8").decode(fileBytes);
    } else if (ft === "image") {
      extractedText = `[IMAGE_BASE64:${fileBase64}]`;
    }

    // Call AI for analysis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const isImage = ft === "image";
    const messages = buildAIMessages(extractedText, fileName, isImage, fileBase64);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools: [{
          type: "function",
          function: {
            name: "document_analysis",
            description: "Extract summary, entities, sentiment, confidence, and language from a document",
            parameters: {
              type: "object",
              properties: {
                summary: {
                  type: "string",
                  description: "A concise and accurate summary of the document content, capturing the key points and purpose of the document"
                },
                entities: {
                  type: "object",
                  properties: {
                    names: {
                      type: "array",
                      items: { type: "string" },
                      description: "All person names mentioned in the document"
                    },
                    dates: {
                      type: "array",
                      items: { type: "string" },
                      description: "All dates mentioned in the document, in their original format"
                    },
                    organizations: {
                      type: "array",
                      items: { type: "string" },
                      description: "All organization/company names mentioned in the document"
                    },
                    amounts: {
                      type: "array",
                      items: { type: "string" },
                      description: "All monetary amounts mentioned in the document, with currency symbols"
                    },
                    locations: {
                      type: "array",
                      items: { type: "string" },
                      description: "All location names (cities, countries, addresses, regions) mentioned in the document"
                    }
                  },
                  required: ["names", "dates", "organizations", "amounts", "locations"]
                },
                sentiment: {
                  type: "string",
                  enum: ["Positive", "Negative", "Neutral"],
                  description: "The overall sentiment of the document content"
                },
                confidence: {
                  type: "number",
                  description: "A confidence score between 0 and 100 indicating how confident the analysis is"
                },
                language: {
                  type: "string",
                  description: "The detected language of the document (e.g. English, Hindi, Spanish)"
                }
              },
              required: ["summary", "entities", "sentiment", "confidence", "language"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "document_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ status: "error", message: "Rate limit exceeded, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ status: "error", message: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("AI did not return structured output");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({
      status: "success",
      fileName,
      summary: analysis.summary,
      entities: analysis.entities,
      sentiment: analysis.sentiment,
      confidence: analysis.confidence,
      language: analysis.language,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({
      status: "error",
      message: e instanceof Error ? e.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function extractTextFromPDF(bytes: Uint8Array): string {
  // Extract text from PDF by parsing the raw PDF structure
  const text = new TextDecoder("latin1").decode(bytes);
  const extractedParts: string[] = [];

  // Extract text from stream objects
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = streamRegex.exec(text)) !== null) {
    const streamContent = match[1];
    // Look for text operators: Tj, TJ, ', "
    const textOps = streamContent.match(/\(([^)]*)\)\s*Tj/g);
    if (textOps) {
      for (const op of textOps) {
        const m = op.match(/\(([^)]*)\)/);
        if (m) extractedParts.push(m[1]);
      }
    }
    // TJ operator with arrays
    const tjArrays = streamContent.match(/\[(.*?)\]\s*TJ/g);
    if (tjArrays) {
      for (const arr of tjArrays) {
        const strings = arr.match(/\(([^)]*)\)/g);
        if (strings) {
          extractedParts.push(strings.map(s => s.slice(1, -1)).join(""));
        }
      }
    }
    // BT...ET blocks with text
    const btBlocks = streamContent.match(/BT[\s\S]*?ET/g);
    if (btBlocks) {
      for (const block of btBlocks) {
        const texts = block.match(/\(([^)]*)\)\s*T[jJ'\"]/g);
        if (texts) {
          for (const t of texts) {
            const m = t.match(/\(([^)]*)\)/);
            if (m && !extractedParts.includes(m[1])) extractedParts.push(m[1]);
          }
        }
      }
    }
  }

  // If no text extracted from streams, try to find plain text content
  if (extractedParts.length === 0) {
    // Try to find text between parentheses in the entire document
    const allText = text.match(/\(([^()]{3,})\)/g);
    if (allText) {
      for (const t of allText) {
        const clean = t.slice(1, -1)
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "")
          .replace(/\\\(/g, "(")
          .replace(/\\\)/g, ")")
          .replace(/\\\\/g, "\\");
        if (clean.length > 2 && /[a-zA-Z]/.test(clean)) {
          extractedParts.push(clean);
        }
      }
    }
  }

  let result = extractedParts.join(" ")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");

  return result || "[Unable to extract text from PDF - the document may be scanned/image-based]";
}

async function extractTextFromDOCX(bytes: Uint8Array): Promise<string> {
  // DOCX is a ZIP file containing XML
  // We need to find and parse word/document.xml
  
  // Find ZIP local file headers and extract document.xml
  const text = await extractXMLFromZip(bytes, "word/document.xml");
  
  if (!text) {
    return "[Unable to extract text from DOCX]";
  }

  // Strip XML tags and extract text content
  const cleanText = text
    .replace(/<w:br[^>]*\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec)))
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleanText || "[Unable to extract text from DOCX]";
}

async function extractXMLFromZip(zipBytes: Uint8Array, targetFile: string): Promise<string | null> {
  // Simple ZIP parser to find and extract a specific file
  const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);
  let offset = 0;

  while (offset < zipBytes.length - 4) {
    const signature = view.getUint32(offset, true);
    
    // Local file header signature
    if (signature !== 0x04034b50) {
      offset++;
      continue;
    }

    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const uncompressedSize = view.getUint32(offset + 22, true);
    const fileNameLength = view.getUint16(offset + 26, true);
    const extraFieldLength = view.getUint16(offset + 28, true);
    
    const fileNameBytes = zipBytes.slice(offset + 30, offset + 30 + fileNameLength);
    const fileName = new TextDecoder().decode(fileNameBytes);
    
    const dataOffset = offset + 30 + fileNameLength + extraFieldLength;
    
    if (fileName === targetFile) {
      const fileData = zipBytes.slice(dataOffset, dataOffset + compressedSize);
      
      if (compressionMethod === 0) {
        // Stored (no compression)
        return new TextDecoder().decode(fileData);
      } else if (compressionMethod === 8) {
        // Deflate
        const ds = new DecompressionStream("deflate-raw");
        const writer = ds.writable.getWriter();
        const reader = ds.readable.getReader();
        
        writer.write(fileData);
        writer.close();
        
        const chunks: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        
        const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
        const result = new Uint8Array(totalLength);
        let pos = 0;
        for (const chunk of chunks) {
          result.set(chunk, pos);
          pos += chunk.length;
        }
        
        return new TextDecoder().decode(result);
      }
    }
    
    offset = dataOffset + compressedSize;
    if (compressedSize === 0 && uncompressedSize === 0) {
      // Data descriptor may follow, skip ahead
      offset = dataOffset + 1;
    }
  }

  return null;
}

function buildAIMessages(extractedText: string, fileName: string, isImage: boolean, fileBase64: string) {
  const systemPrompt = `You are an expert document analysis AI. Your task is to analyze documents and extract:
1. A concise, accurate summary of the document content
2. Named entities: person names, dates, organizations, monetary amounts, and locations
3. Overall sentiment classification (Positive, Negative, or Neutral)
4. A confidence score (0-100) indicating how confident you are in the analysis
5. The detected language of the document

Be thorough in entity extraction - find ALL names, dates, organizations, monetary amounts, and locations.
For sentiment, consider the overall tone and content of the document.
For summary, be concise but capture all key points.
For confidence, consider text quality, clarity, and completeness.`;

  if (isImage) {
    return [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this image document "${fileName}". Extract all text via OCR, then provide summary, entities, and sentiment analysis.`
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${fileBase64}`
            }
          }
        ]
      }
    ];
  }

  return [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Analyze this document "${fileName}". Here is the extracted text content:\n\n${extractedText}\n\nProvide a comprehensive analysis with summary, entities, and sentiment.`
    }
  ];
}

function extractTextFromSpreadsheet(bytes: Uint8Array, fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  
  if (ext === "csv") {
    return new TextDecoder("utf-8").decode(bytes);
  }
  
  // For XLSX/XLS - extract shared strings and sheet data from ZIP
  return extractXLSXText(bytes);
}

function extractXLSXText(bytes: Uint8Array): string {
  const parts: string[] = [];
  
  // Try to extract shared strings XML
  const sharedStrings = extractXMLFromZipSync(bytes, "xl/sharedStrings.xml");
  const stringValues: string[] = [];
  
  if (sharedStrings) {
    const matches = sharedStrings.match(/<t[^>]*>([^<]+)<\/t>/g);
    if (matches) {
      for (const m of matches) {
        const val = m.replace(/<[^>]+>/g, "").trim();
        if (val) stringValues.push(val);
      }
    }
  }
  
  if (stringValues.length > 0) {
    parts.push(stringValues.join("\t"));
  }
  
  // Try sheet1
  const sheet1 = extractXMLFromZipSync(bytes, "xl/worksheets/sheet1.xml");
  if (sheet1) {
    const values = sheet1.match(/<v>([^<]+)<\/v>/g);
    if (values) {
      parts.push(values.map(v => v.replace(/<[^>]+>/g, "")).join("\t"));
    }
  }
  
  return parts.join("\n") || "[Unable to extract text from spreadsheet]";
}

function extractXMLFromZipSync(zipBytes: Uint8Array, targetFile: string): string | null {
  const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);
  let offset = 0;

  while (offset < zipBytes.length - 4) {
    const signature = view.getUint32(offset, true);
    if (signature !== 0x04034b50) { offset++; continue; }

    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const uncompressedSize = view.getUint32(offset + 22, true);
    const fileNameLength = view.getUint16(offset + 26, true);
    const extraFieldLength = view.getUint16(offset + 28, true);
    const fileNameBytes = zipBytes.slice(offset + 30, offset + 30 + fileNameLength);
    const fileName = new TextDecoder().decode(fileNameBytes);
    const dataOffset = offset + 30 + fileNameLength + extraFieldLength;

    if (fileName === targetFile && compressionMethod === 0) {
      return new TextDecoder().decode(zipBytes.slice(dataOffset, dataOffset + compressedSize));
    }

    offset = dataOffset + compressedSize;
    if (compressedSize === 0 && uncompressedSize === 0) offset = dataOffset + 1;
  }
  return null;
}

async function extractTextFromPresentation(bytes: Uint8Array): Promise<string> {
  const parts: string[] = [];
  
  // PPTX is a ZIP with ppt/slides/slide*.xml
  for (let i = 1; i <= 50; i++) {
    const slideXml = await extractXMLFromZip(bytes, `ppt/slides/slide${i}.xml`);
    if (!slideXml) break;
    
    const texts = slideXml.match(/<a:t>([^<]*)<\/a:t>/g);
    if (texts) {
      const slideText = texts.map(t => t.replace(/<[^>]+>/g, "")).join(" ");
      if (slideText.trim()) parts.push(`Slide ${i}: ${slideText.trim()}`);
    }
  }
  
  return parts.join("\n\n") || "[Unable to extract text from presentation]";
}
