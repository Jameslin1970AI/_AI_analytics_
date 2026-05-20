import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { 
  Sparkles, 
  Trash2, 
  Copy, 
  Check, 
  RotateCcw, 
  Globe, 
  Sliders, 
  FileText, 
  Download, 
  Clock, 
  History, 
  Layers, 
  FileDown,
  X,
  PlusCircle,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProcessHistoryItem, SummaryStyle, TranslationLanguage, ProcessingOptions } from "./types";

// High-quality pre-populated sample templates for instant testing
const PRESETS = [
  {
    id: "preset-1",
    title: "Q3 產品上線時程同步會",
    description: "涉及設計稿交接、API 瓶頸與 Beta 測試時程確認",
    text: `陳經理：大家早安，今天我們要討論 Q3 的產品上線時程。目前設計端與工程端的進度如何？

林設計師：設計部分介面已經完成 90%，主要是暗色模式的配色還在根據品牌規範微調。預計週五前可以交接給工程組。

王工程師：目前 API 串接遇到一些非同步請求的延遲問題，我們正在優化快取機制。如果設計稿週五能到位，我們下週三可以完成 Beta 版測試。

陳經理：好，那行銷端的文案也請在下週一前定案。大家的待辦完成後同步到 Trello 追蹤。辛苦了。`
  },
  {
    id: "preset-2",
    title: "每週行銷推廣策略商討",
    description: "社群媒體短影音預算、轉化與時程安排",
    text: `行銷總監 Amy：我們下個月的社群媒體推廣計畫需要定案。這次主要是推廣我們新推出的智慧型會議助理。

廣告企劃 Leo：我建議在 LinkedIn 和 Facebook 同步投放短影音廣告，並配合 KOL 開箱體驗文。第一階段預算預估在 15 萬元新台幣。

設計師 Chloe：短影音的視覺模板我已經在 Canva 做好了三套，Amy 你看一下比較喜歡哪一款。

Amy：第二款不錯，顏色溫暖又符合品牌調性。Leo，你的詳細預算表週四下班前給我看看，若沒問題我們週五早上簽核。

Leo：沒問題，我還會附上預期的轉換率分析與受眾群畫像。

Chloe：那我這兩天先把影片剪出來，下週一交付第一版影片素材給 Amy 審核。`
  },
  {
    id: "preset-3",
    title: "系統架構優化與安全升級",
    description: "高延遲優化、Redis 快取與 API 遷移至 JWT 安全驗證",
    text: `技術長 Gary：大家下午好。今天我們需要盤點下個季度伺服器端要做的防護架構與效能優化。

後端工程師 Ian：目前資料庫查詢的延遲在高峰期會達到 400ms，主要是讀寫未分離，且快取機制需要重構。我提議引進 Redis 做二級快取，並部署一主二從的主從副本架構。

資安小組長 Peggy：沒錯，另外我們 API 的權限驗證目前是使用舊版的 Session，並不夠安全。下個月我們會硬性要求全部驗證遷移到 JWT (JSON Web Tokens)，並搭配網域端 HTTPS 嚴格傳輸安全性 (HSTS) 設定。

Gary：Ian，重構快取和主從架構需要多少時間？

Ian：評估大約需要 5 個工作天，可以在測試站上先跑，我預計下週一開始動工，下週五完成上線評估與加壓測試。

Gary：好。Peggy 你們的 JWT 遷移指南與範例程式碼，請在週三前提供給後端小組。 Ian 收到後在這次重構中一併實作安全防禦。大家加油，安全第一。`
  }
];

export default function App() {
  // Application State
  const [inputText, setInputText] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<SummaryStyle>("complete");
  const [selectedLanguage, setSelectedLanguage] = useState<TranslationLanguage>("none");
  const [customFocus, setCustomFocus] = useState<string>("");
  
  // Processing & Success State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resultText, setResultText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [processDuration, setProcessDuration] = useState<number | null>(null);

  // History / Sidebar states
  const [history, setHistory] = useState<ProcessHistoryItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [activeHistoryItem, setActiveHistoryItem] = useState<string | null>(null);

  // Load History from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("meeting_assistant_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history:", e);
      }
    }
  }, []);

  // Sync History to localStorage
  const saveHistoryToLocalStorage = (newHistory: ProcessHistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem("meeting_assistant_history", JSON.stringify(newHistory));
  };

  // Preset Applier
  const applyPreset = (preset: typeof PRESETS[0]) => {
    setInputText(preset.text);
    setTitle(preset.title + " (分析預覽)");
    setErrorMessage("");
  };

  // Helper of word / character counting
  const charCount = inputText.length;

  // Clear Input Action
  const clearInput = () => {
    setInputText("");
    setTitle("");
    setErrorMessage("");
  };

  // Core API Submission Handler
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) {
      setErrorMessage("請先輸入或貼上會議逐字稿內容！");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setResultText("");
    setProcessDuration(null);

    const startTime = Date.now();
    const finalTitle = title.trim() || `會議摘要_${new Date().toLocaleDateString("zh-TW")}`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalText: inputText,
          title: finalTitle,
          style: selectedStyle,
          language: selectedLanguage,
          customFocus: customFocus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "生成失敗，伺服器無預期回應。");
      }

      const finishTime = Date.now();
      const elapsed = finishTime - startTime;
      setProcessDuration(elapsed);
      setResultText(data.result);

      // Create new history entry
      const newHistoryItem: ProcessHistoryItem = {
        id: `h-${Date.now()}`,
        title: finalTitle,
        timestamp: new Date().toLocaleTimeString("zh-TW", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
        originalText: inputText,
        resultText: data.result,
        language: selectedLanguage,
        style: selectedStyle,
        customFocus: customFocus,
        durationMs: elapsed,
      };

      const updatedHistory = [newHistoryItem, ...history];
      saveHistoryToLocalStorage(updatedHistory);
      setActiveHistoryItem(newHistoryItem.id);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "發生連線錯誤，請確認伺服器運作正常。");
    } finally {
      setIsLoading(false);
    }
  };

  // Copy to Clipboard Action
  const copyToClipboard = () => {
    if (!resultText) return;
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Markdown File Action
  const downloadMarkdown = () => {
    if (!resultText) return;
    const cleanTitle = title.trim() || `AI_會議紀錄_${new Date().toISOString().slice(0, 10)}`;
    const element = document.createElement("a");
    const file = new Blob([resultText], { type: "text/markdown;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `${cleanTitle}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Load selected history item
  const loadHistoryItem = (item: ProcessHistoryItem) => {
    setInputText(item.originalText);
    setTitle(item.title);
    setResultText(item.resultText);
    setSelectedStyle(item.style as SummaryStyle);
    setSelectedLanguage(item.language as TranslationLanguage);
    setCustomFocus(item.customFocus || "");
    setActiveHistoryItem(item.id);
    setErrorMessage("");
    // Close sidebar on mobile/small screens when item loaded
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // Delete history item
  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    saveHistoryToLocalStorage(updated);
    if (activeHistoryItem === id) {
      setActiveHistoryItem(null);
      setResultText("");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex flex-col font-sans text-[#4A4A40] overflow-x-hidden antialiased">
      {/* Decorative Top Accent Stripe */}
      <div className="h-1 bg-[#5A5A40] w-full" />

      {/* Header Panel */}
      <header className="h-16 px-4 md:px-8 border-b border-[#E5E1D8] bg-white flex items-center justify-between shadow-sm shrink-0 z-20">
        <div className="flex items-center gap-3">
          {/* Logo Brand Icon */}
          <div className="w-10 h-10 bg-[#5A5A40] rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-[#5A5A40]/10">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-[#5A5A40] text-base md:text-lg tracking-tight leading-none flex items-center gap-2">
              AI 會議記錄生成與翻譯工具
            </h1>
            <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-[#8C867A] font-semibold mt-1">
              Intelligent Meeting Processing & Summary Agent
            </p>
          </div>
        </div>

        {/* Action Widgets */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* History Button Selector */}
          <button 
            id="view-history"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-all ${
              sidebarOpen 
                ? "bg-[#5A5A40] text-white border-[#5A5A40]" 
                : "bg-white hover:bg-[#F2F1EC] border-[#E5E1D8] text-[#5A5A40]"
            }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">歷史紀錄 ({history.length})</span>
            <span className="sm:hidden">{history.length}</span>
          </button>

          {/* Connected System Badge */}
          <div className="hidden md:flex items-center gap-2 bg-[#EFECE7] px-3.5 py-1.5 rounded-full border border-[#E5E1D8]">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[11px] font-bold text-[#5A5A40]">Gemini 3.5 已伺服器端連線</span>
          </div>

          {/* User Marker */}
          <div className="w-9 h-9 rounded-full bg-[#E5E1D8] border-2 border-white shadow-sm flex items-center justify-center font-bold text-[#5A5A40] text-sm shrink-0 uppercase select-none">
            AI
          </div>
        </div>
      </header>

      {/* Application Main Layout Container */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Sliding History Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Overlay Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="absolute inset-0 bg-[#4A4A40] z-30 lg:hidden"
              />

              {/* Sidebar Content drawer */}
              <motion.aside 
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute lg:relative w-80 max-w-[85vw] h-full bg-white border-r border-[#E5E1D8] flex flex-col z-40 shrink-0 shadow-lg lg:shadow-none"
              >
                <div className="p-4 border-b border-[#E5E1D8] flex items-center justify-between bg-[#FDFBF9]">
                  <h3 className="text-xs font-extrabold text-[#5A5A40] uppercase tracking-wider flex items-center gap-2">
                    <History className="w-4 h-4 text-[#8C867A]" /> 
                    已保存之會議紀錄
                  </h3>
                  <button 
                    onClick={() => setSidebarOpen(false)}
                    className="p-1 hover:bg-[#F2F1EC] rounded text-[#8C867A]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* History list content */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {history.length === 0 ? (
                    <div className="py-12 px-4 text-center">
                      <Clock className="w-8 h-8 text-[#A8A29E] mx-auto mb-2.5 opacity-60" />
                      <p className="text-xs text-[#A8A29E] font-medium leading-relaxed">
                        目前尚無處理過的歷史會議記錄。
                      </p>
                      <p className="text-[10px] text-[#A8A29E] mt-1">
                        開始輸入逐字稿並生成，記錄便會顯示在此。
                      </p>
                    </div>
                  ) : (
                    history.map((item) => {
                      const isActive = activeHistoryItem === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => loadHistoryItem(item)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all relative group ${
                            isActive
                              ? "bg-[#F2F1EC] border-[#5A5A40] shadow-sm"
                              : "bg-white hover:bg-[#F7F5F2] border-[#E5E1D8]"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-xs font-bold text-[#4A4A40] line-clamp-2 block tracking-tight pr-6">
                              {item.title}
                            </h4>
                            <button
                              onClick={(e) => deleteHistoryItem(item.id, e)}
                              className="absolute top-2.5 right-2 px-1 py-1 rounded-md text-[#A8A29E] hover:text-red-500 hover:bg-red-50 hover:opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all"
                              title="刪除此記錄"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <div className="mt-2.5 flex items-center justify-between text-[10px] text-[#8C867A] font-medium">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.timestamp}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-[#FAF9F6] border border-[#E5E1D8] text-[9px] uppercase font-bold text-[#8C867A]">
                              {item.language === "none" ? "中文摘要" : "已編譯翻譯"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-4 bg-[#F2F1EC] border-t border-[#E5E1D8] text-[10px] text-[#8C867A] text-center font-medium">
                  歷史資料僅儲存於您的瀏覽器本地
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Work Area Grid */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col xl:flex-row gap-6 lg:gap-8 h-full overflow-y-auto">
          
          {/* LEFT COLUMN: Input form and templates */}
          <section className="flex-1 flex flex-col gap-5 min-w-0 max-w-full">
            
            {/* Quick Templates presets */}
            <div className="bg-white border border-[#E5E1D8] rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-[#5A5A40]" />
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#8C867A]">
                  快捷範本測試
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className="flex flex-col text-left p-3 rounded-xl border border-[#E5E1D8] bg-[#FAF9F6] hover:bg-white hover:border-[#5A5A40] hover:shadow-sm transition-all focus:outline-none"
                  >
                    <span className="text-xs font-bold text-[#5A5A40] mb-1 line-clamp-1">
                      {preset.title}
                    </span>
                    <span className="text-[10px] text-[#8C867A] line-clamp-2 leading-relaxed">
                      {preset.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Form Fields */}
            <form onSubmit={handleGenerate} className="flex-1 flex flex-col gap-4">
              
              {/* Transcript large text field */}
              <div className="flex-1 flex flex-col gap-2 min-h-[350px]">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#8C867A] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#5A5A40]" />
                    1. 會議記錄與逐字稿貼入
                  </label>
                  {inputText && (
                    <button
                      type="button"
                      onClick={clearInput}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      清除重填
                    </button>
                  )}
                </div>

                <div className="flex-1 relative flex flex-col">
                  {/* Meeting Title Optional */}
                  <input
                    type="text"
                    placeholder="請輸入會議名稱 (選填，如：Q3 專案進度同步會議)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#E5E1D8] rounded-t-2xl shadow-sm border-b-0 focus:ring-0 focus:border-[#E5E1D8] outline-none text-sm font-bold text-[#4A4A40]"
                  />

                  {/* Main Textarea */}
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full flex-1 p-5 bg-white border border-[#E5E1D8] rounded-b-2xl shadow-sm focus:ring-2 focus:ring-[#5A5A40] focus:border-transparent outline-none resize-none text-sm leading-relaxed"
                    placeholder="請在此貼上您的會議記錄短筆記、討論大綱，或較為零亂的會議逐字稿內容。
範例：
陳經理：大家早安，今天我們要討論 Q3 產品上線時程。目前設計端與工程端的進度如何？..."
                  />

                  {/* Character Counter tag */}
                  <div className="absolute bottom-3 right-3 text-[10px] bg-[#F2F1EC] px-2 py-1 rounded-md border border-[#E5E1D8] text-[#8C867A] font-bold">
                    字數：{charCount.toLocaleString()} 字
                  </div>
                </div>
              </div>

              {/* Options & Configuration Block */}
              <div className="bg-white border border-[#E5E1D8] rounded-2xl shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#F2F1EC]">
                  <Sliders className="w-4 h-4 text-[#5A5A40]" />
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#8C867A]">
                    智慧分析設定 (Advanced Options)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Style Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#8C867A] flex items-center gap-1.5">
                      會議摘要風格 / 精細度
                    </label>
                    <select
                      value={selectedStyle}
                      onChange={(e) => setSelectedStyle(e.target.value as SummaryStyle)}
                      className="w-full bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#5A5A40]/50"
                    >
                      <option value="complete">完整版 (討論細節 + 決策 + 待辦表格)</option>
                      <option value="concise">極簡短 (只列核心主題、關鍵論點)</option>
                      <option value="decisions">僅決策組 (僅呈現結論與行動待辦表)</option>
                    </select>
                  </div>

                  {/* Language Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#8C867A] flex items-center gap-1.5">
                      翻譯轉換目標 (AI Translation)
                    </label>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value as TranslationLanguage)}
                      className="w-full bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#5A5A40]/50"
                    >
                      <option value="none">不需翻譯 (維持繁體中文格式化)</option>
                      <option value="en">英文 (English 專業商務)</option>
                      <option value="ja">日文 (日本語 敬語語體)</option>
                      <option value="ko">韓文 (한국어 格式化輸出)</option>
                      <option value="bilingual">中英雙語對照 (Traditional Chinese & English)</option>
                    </select>
                  </div>
                </div>

                {/* Focus / Constraint text area */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8C867A] flex items-center gap-1.5">
                    自訂關注焦點與優化條款 (選填)
                  </label>
                  <input
                    type="text"
                    value={customFocus}
                    onChange={(e) => setCustomFocus(e.target.value)}
                    placeholder="例如：『請特別注重行銷部門的工作交付時間』、『強調安全設定』..."
                    className="w-full bg-[#FAF9F6] border border-[#E5E1D8] rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-[#5A5A40]/50 text-[#4A4A40]"
                  />
                </div>
              </div>

              {/* Error Warning alert banner */}
              {errorMessage && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-red-800 font-medium">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-500" />
                  <div>
                    {errorMessage}
                  </div>
                </div>
              )}

              {/* Generate Trigger Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 px-6 font-bold text-sm tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#5A5A40]/10 ${
                  isLoading
                    ? "bg-[#8C867A] text-white cursor-not-allowed cursor-wait"
                    : "bg-[#5A5A40] text-white hover:bg-[#4D4D36] active:translate-y-0.5"
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    AI 智慧提煉與排版分析中，請稍候...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200 font-bold" />
                    立即生成 AI 會議總結與翻譯
                  </>
                )}
              </button>
            </form>
          </section>

          {/* RIGHT COLUMN: Interactive markdown report summary rendered card */}
          <section className="flex-1 flex flex-col gap-4 min-w-0 max-w-full">
            <div className="flex justify-between items-end shrink-0">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#8C867A] flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#5A5A40]" />
                2. AI 智慧分析結果與報表
              </h2>

              {/* Action buttons (only displayed if result is present) */}
              {resultText && (
                <div className="flex gap-2">
                  {/* Copy button */}
                  <button
                    onClick={copyToClipboard}
                    className="p-2 bg-white border border-[#E5E1D8] hover:bg-[#F2F1EC] rounded-lg shadow-sm text-[#5A5A40] transition-colors flex items-center gap-1 text-xs font-bold font-sans cursor-pointer"
                    title="複製 Markdown 到剪貼簿"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-green-600">已複製</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>複製報告</span>
                      </>
                    )}
                  </button>

                  {/* Download button */}
                  <button
                    onClick={downloadMarkdown}
                    className="p-2 bg-white border border-[#E5E1D8] hover:bg-[#F2F1EC] rounded-lg shadow-sm text-[#5A5A40] transition-colors flex items-center gap-1 text-xs font-bold font-sans cursor-pointer"
                    title="匯出為 Markdown 檔案"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>下載檔案</span>
                  </button>
                </div>
              )}
            </div>

            {/* Core Display Result Box */}
            <div className="flex-1 min-h-[450px] bg-white border border-[#E5E1D8] rounded-2xl shadow-sm p-6 md:p-8 flex flex-col relative overflow-hidden">
              
              <AnimatePresence mode="wait">
                {isLoading ? (
                  // Super polished loading states with pulsing text and subtle animation
                  <motion.div 
                    key="comp-loading"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-8 text-center z-10"
                  >
                    <div className="relative mb-6">
                      <div className="w-16 h-16 rounded-full border-4 border-[#E2DFD3] border-t-[#5A5A40] animate-spin" />
                      <Sparkles className="w-6 h-6 text-[#5A5A40] absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <h3 className="text-sm font-bold text-[#5A5A40] mb-2 font-serif italic">
                      AI 團隊分析與語言翻譯正在進行
                    </h3>
                    <p className="text-xs text-[#8C867A] max-w-xs leading-relaxed animate-pulse">
                      我們正在為您梳理發言人觀點、重整待辦目標，並將結果與所需的語系進行精確編譯...
                    </p>
                    <div className="mt-8 flex gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#5A5A40]/40 animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#5A5A40]/70 animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#5A5A40] animate-bounce"></span>
                    </div>
                  </motion.div>
                ) : resultText ? (
                  // Actual Rich rendered Output with elegant fade-in
                  <motion.div 
                    key="comp-result"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex flex-col h-full"
                  >
                    {/* Header Summary Stats in Natural Tones report panel style */}
                    <div className="mb-6 pb-4 border-b border-dashed border-[#E5E1D8] flex flex-wrap justify-between items-end gap-2">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-[#8C867A] font-bold">
                          AI 智慧會議彙整報告
                        </span>
                        <h3 className="text-sm font-bold text-[#5A5A40] mt-0.5">
                          {title.trim() || "會議紀要報告"}
                        </h3>
                      </div>
                      <div className="text-[10px] text-[#8C867A] font-medium text-right">
                        <span>分析時程：{processDuration ? `${(processDuration / 1000).toFixed(2)}s` : "快速讀取"}</span>
                        <div className="space-x-1.5 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded bg-[#F2F1EC] text-[9px] font-bold text-[#5A5A40]">
                            風格: {selectedStyle === "complete" ? "全析" : selectedStyle === "concise" ? "簡析" : "決策"}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-[#F2F1EC] text-[9px] font-bold text-[#5A5A40]">
                            語系: {selectedLanguage === "none" ? "中文" : selectedLanguage === "en" ? "英文" : selectedLanguage === "ja" ? "日文" : selectedLanguage === "ko" ? "韓文" : "雙語"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Markdown Renderer wrapped inside beautiful container */}
                    <div className="flex-1 overflow-y-auto pr-2">
                      <div className="markdown-body">
                        <ReactMarkdown>{resultText}</ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  // Clean beautifully styled elegant Placeholder
                  <motion.div 
                    key="comp-placeholder"
                    className="flex-1 flex flex-col items-center justify-center text-center py-12"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#F2F1EC] border border-[#E5E1D8] flex items-center justify-center mb-4 text-[#8C867A]">
                      <FileDown className="w-6 h-6 opacity-70" />
                    </div>
                    <h3 className="text-sm font-bold text-[#5A5A40] font-serif italic mb-1.5">
                      等待 AI 智能記錄提煉與呈現
                    </h3>
                    <p className="text-xs text-[#8C867A] max-w-sm leading-relaxed mb-6">
                      您可以在左側貼上您的會議紀錄，或任選一個「快捷範本測試」按鈕，然後點選「立即生成 AI 會議總結」進行智慧分析。
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      <div className="flex items-center gap-1 text-[11px] font-medium bg-[#F2F1EC] text-[#8C867A] px-2.5 py-1 rounded-md">
                        <Check className="w-3.5 h-3.5 text-[#5A5A40]" /> 格式化規整
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-medium bg-[#F2F1EC] text-[#8C867A] px-2.5 py-1 rounded-md">
                        <Check className="w-3.5 h-3.5 text-[#5A5A40]" /> 待辦事項表格
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-medium bg-[#F2F1EC] text-[#8C867A] px-2.5 py-1 rounded-md">
                        <Check className="w-3.5 h-3.5 text-[#5A5A40]" /> 多語系商務翻譯
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </section>

        </main>
      </div>

      {/* Styled Footer */}
      <footer className="h-12 px-4 md:px-8 bg-[#F2F1EC] border-t border-[#E5E1D8] flex items-center justify-between text-[11px] font-medium text-[#8C867A] shrink-0 z-20">
        <div className="flex gap-4 overflow-x-auto whitespace-nowrap">
          <span>系統設定：流暢繁體中文優化已啟用</span>
          <span className="hidden sm:inline">|</span>
          <span>生成核心：Gemini 3.5-flash</span>
          <span className="hidden sm:inline">|</span>
          <span>時鐘設定：UTC (2026) 已同步</span>
        </div>
        <div className="hidden sm:flex gap-4 items-center">
          <div className="flex -space-x-1.5">
            <div className="w-5 h-5 rounded-full bg-[#5A5A40]/40 border border-white flex items-center justify-center text-[8px] text-white">陳</div>
            <div className="w-5 h-5 rounded-full bg-[#8C867A]/60 border border-white flex items-center justify-center text-[8px] text-white">林</div>
            <div className="w-5 h-5 rounded-full bg-[#A8A29E] border border-white flex items-center justify-center text-[8px] text-white">王</div>
          </div>
          <span className="text-[10px]">專案成員協作模式已開啟</span>
        </div>
      </footer>
    </div>
  );
}
