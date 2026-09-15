import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Health
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      aiAvailable: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // AI Chat endpoint
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, context } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const ai = getGenAI();
      if (!ai) {
        return res.status(503).json({
          error: "Gemini API key is not configured in Settings > Secrets.",
        });
      }

      const systemInstruction = `
You are the AI Business Assistant for "Smart Invoice Manager".
You assist the business owner with analyzing their sales, payments, overdue invoices, expenses, and operational advice.
CRITICAL RULES:
1. ONLY use the verified business financial data provided below in the context.
2. NEVER invent, hallucinate, or assume any financial numbers. If the data is 0 or empty, explicitly state that.
3. For numerical answers, cite the exact totals and calculation breakdown from the context.
4. Keep answers concise, actionable, and formatted with clean bullet points.
5. If the user asks for suggestions to improve sales or cash flow, provide practical, small-business-focused advice.

CURRENT BUSINESS CONTEXT:
${JSON.stringify(context || {}, null, 2)}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: message,
        config: {
          systemInstruction,
        },
      });

      res.json({ reply: response.text || "No response generated." });
    } catch (error: any) {
      console.error("AI chat error:", error);
      res.status(500).json({
        error: error.message || "Failed to process AI assistant request.",
      });
    }
  });

  // AI Invoice parsing
  app.post("/api/ai/parse-invoice", async (req, res) => {
    try {
      const { prompt, defaultCurrency, defaultTaxRate } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const ai = getGenAI();
      if (!ai) {
        return res.status(503).json({
          error: "Gemini API key is not configured in Settings > Secrets.",
        });
      }

      const systemInstruction = `
You are an expert invoice parser for "Smart Invoice Manager".
Convert the user's natural language request into a clean, structured invoice payload JSON.
Output ONLY a JSON object matching this schema:
{
  "customerName": string,
  "customerEmail": string (optional, empty string if not mentioned),
  "items": [
    {
      "name": string,
      "quantity": number,
      "unitPrice": number,
      "taxRate": number (use default ${defaultTaxRate ?? 0} if not specified)
    }
  ],
  "discountType": "percentage" | "fixed",
  "discountValue": number,
  "notes": string,
  "currency": "${defaultCurrency || "USD"}"
}
Ensure numeric values are clean positive numbers.
Do not wrap in markdown quotes if possible, output valid JSON.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "{}";
      const parsed = JSON.parse(text);
      res.json({ data: parsed });
    } catch (error: any) {
      console.error("AI invoice parser error:", error);
      res.status(500).json({
        error: error.message || "Failed to parse invoice details from prompt.",
      });
    }
  });

  // AI Business Summary
  app.post("/api/ai/business-summary", async (req, res) => {
    try {
      const { metrics } = req.body;

      const ai = getGenAI();
      if (!ai) {
        return res.status(503).json({
          error: "Gemini API key is not configured in Settings > Secrets.",
        });
      }

      const systemInstruction = `
You are a senior financial analyst and business advisor for "Smart Invoice Manager".
Analyze the provided business metrics and generate an executive business performance summary.
Structure your output into:
1. Executive Performance Highlights (Sales, Profit, Cash collection rate)
2. Outstanding & Overdue Risks (Specific aging or unpaid exposure)
3. Top Revenue Drivers (Key customers & top selling products)
4. Strategic Action Items (3 high-impact recommendations to improve cash flow and profitability)

IMPORTANT:
- Use the exact numbers provided.
- Do NOT invent fake revenue or expenses.
- Clearly label AI-generated insights.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Here are the verified business metrics:\n${JSON.stringify(metrics || {}, null, 2)}`,
        config: {
          systemInstruction,
        },
      });

      res.json({ summary: response.text || "No summary available." });
    } catch (error: any) {
      console.error("AI summary error:", error);
      res.status(500).json({
        error: error.message || "Failed to generate AI business summary.",
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Invoice Manager server running on http://localhost:${PORT}`);
  });
}

startServer();
