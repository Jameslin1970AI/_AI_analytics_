import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Helper to translate style code to a direct prompt instruction
function getStyleInstruction(style: string): string {
  switch (style) {
    case "concise":
      return "【精簡摘要風格】：只提取最核心的主題、結論，不留任何多贅字詞，以極簡的條列方式呈現。";
    case "decisions":
      return "【僅限關鍵決策與行動方案】：跳過所有討論過程的重述，格式化整理出所有已達成的決策、承諾之事項與下一步行動方案。";
    case "complete":
    default:
      return "【完整詳細分析】：包含詳細討論脈絡、不同利害關係人的發言重點、提案、決策理由、以及完整的待辦事項。";
  }
}

// Helper to translate language target to prompt instruction
function getLanguageInstruction(language: string): string {
  switch (language) {
    case "en":
      return "【翻譯至：英文 (English)】：請將所有分析內容、摘要、待辦事項等以流暢、商務氣息強烈的英文輸出（但標題或專有名詞可附帶中文對照）。";
    case "ja":
      return "【翻譯至：日文 (日本語)】：請將所有分析結果（包含摘要、決策與待辦項目）以正式商務日語（です/ます體）輸出。";
    case "ko":
      return "【翻譯至：韓文 (한국어)】：請將結果以正式、尊重語氣的商務韓語輸出。";
    case "bilingual":
      return "【中英雙語對照】：請逐部提供「繁體中文」與「英文」的對照翻譯，方便跨國團隊閱讀。";
    case "none":
    default:
      return "【維持繁體中文】：請完全以流暢的台灣繁體中文輸出完整的會議記錄與報告。";
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set response limits high enough for extremely long transcripts
  app.use(express.json({ limit: "20mb" }));

  // Initialize Gemini AI Client
  let ai: GoogleGenAI | null = null;
  function getGeminiClient() {
    if (!ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY 尚未配置。請前往 AI Studio 內部的 [Settings > Secrets] 進行設定。");
      }
      ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return ai;
  }

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Main generator endpoint using gemini-3.5-flash
  app.post("/api/generate", async (req, res) => {
    try {
      const { originalText, style, language, customFocus, title } = req.body;

      if (!originalText || typeof originalText !== "string" || !originalText.trim()) {
        return res.status(400).json({ error: "請提供有效的會議逐字稿內容。" });
      }

      const client = getGeminiClient();

      // Formulate detailed configurations
      const styleDesc = getStyleInstruction(style);
      const languageDesc = getLanguageInstruction(language);
      const focusText = customFocus && customFocus.trim() 
        ? `【特別注意焦點與優化需求】：${customFocus.trim()}` 
        : "【特別注意焦點與優化需求】：無特別限制，請進行全面分析與提煉。";

      const systemInstruction = `
你是一位專業的會議記錄助理。請根據使用者提供的會議逐字稿，整理出結構化的會議紀錄。
請務必遵守以下輸出格式要求：

1. **會議主題與時間**：擷取會議的主題與時間。 (若使用者設定自訂主題「${title || ""}」，請優先作為會議主題使用)。
2. **與會者**：列出參與會議的人員。
3. **會議重點總結**：用 3 到 5 個重點總結會議內容。 (摘要精細度參考：${styleDesc})
4. **Action Items (待辦事項)**：明確列出接下來的待辦事項與負責人。
5. **英文翻譯版**：將上述 1~4 點的內容完整翻譯成專業的英文。 (若設定了額外翻譯目標：${languageDesc}，除預設的英文翻譯版外，可以配合翻譯為目標語言)

【自訂特殊專注焦點與指示】：${customFocus && customFocus.trim() ? customFocus.trim() : "無特定額外焦點，請進行精準提取。"}

請以 Markdown 格式輸出，所有繁體中文部分必須使用**繁體中文**回覆，不要包含任何額外的問候語或結語。
`;

      const promptText = `請為以下會議內容生成高品質的會議記錄：
--- 會議逐字稿內容 ---
${originalText}
--- 內容結束 ---`;

      // Implement robust retry logic with exponential backoff for transient 500 INTERNAL state
      let response;
      let attempts = 0;
      const maxAttempts = 3;
      let lastError;

      while (attempts < maxAttempts) {
        try {
          response = await client.models.generateContent({
            model: "gemini-3.5-flash",
            contents: promptText,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.7,
            },
          });
          break; // Succeeded! Break out of the loop.
        } catch (error: any) {
          attempts++;
          lastError = error;
          console.warn(`Gemini generation attempt ${attempts} failed:`, error?.message || error);
          if (attempts < maxAttempts) {
            // Wait 1 second before first retry, 2 seconds before second retry
            await new Promise((resolve) => setTimeout(resolve, attempts * 1000));
          }
        }
      }

      if (!response) {
        throw lastError || new Error("無法從 AI 取得有效回應。");
      }

      const resultText = response.text || "無法生成摘要。可能是模型回傳了空內容。";
      res.json({ result: resultText });

    } catch (error: any) {
      console.error("Gemini Generation Error:", error);
      res.status(500).json({ 
        error: error?.message || "AI 處理過程中發生未知錯誤。請確認您的 GEMINI_API_KEY 已正確配置與連線。" 
      });
    }
  });

  // Enable Vite / SPA server config
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Meeting Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Server startup failed:", err);
});
