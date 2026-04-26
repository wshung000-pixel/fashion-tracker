import { useState, useEffect, useRef } from "react";

const DEFAULT_BRANDS = [
  { id: 1, name: "Supreme", logo: "S", color: "#FF0000" },
  { id: 2, name: "UNIQLO", logo: "U", color: "#E40012" },
  { id: 3, name: "Off-White", logo: "OW", color: "#000000" },
  { id: 4, name: "Acne Studios", logo: "A", color: "#1A1A2E" },
  { id: 5, name: "51percent", logo: "51%", color: "#3D5AFE" },
  { id: 6, name: "HDEX", logo: "HDX", color: "#00BFA5" },
];

const POPULAR_BRANDS = [
  "Supreme", "UNIQLO", "Off-White", "Acne Studios", "Stone Island",
  "Maison Margiela", "A.P.C.", "Carhartt WIP", "Stüssy", "Nike",
  "Adidas", "Loewe", "Bottega Veneta", "Celine", "Jacquemus",
  "Our Legacy", "Aime Leon Dore", "Kith", "Palace", "Noah",
  "51percent", "HDEX",
];

const BRAND_COLORS = [
  "#FF4444", "#FF8C00", "#FFD700", "#00C853", "#00B4D8",
  "#7B2FBE", "#E91E63", "#1565C0", "#2E7D32", "#4A148C",
];

async function fetchBrandNews(brandName) {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY || "";
  const prompt = `Search the web and find the latest new arrivals, new collections, or recent product drops from ${brandName} fashion brand in 2025 or 2026. ${["51percent", "HDEX"].includes(brandName) ? "Note: This is a Korean streetwear brand — also search Korean sources like Musinsa, brand Instagram, or official Korean websites." : ""}
Return ONLY a valid JSON object (no markdown, no backticks, no explanation) with this exact structure:
{
  "brand": "${brandName}",
  "lastUpdated": "approximate date",
  "items": [
    {
      "name": "product name",
      "category": "category (e.g. 衛衣/T-shirt/外套/鞋款/配件)",
      "description": "brief description in Traditional Chinese (繁體中文)",
      "price": "price range if known, otherwise null",
      "isNew": true
    }
  ],
  "summary": "一句話總結這季新品重點 (in Traditional Chinese 繁體中文)"
}
Include 3-5 items. Return only the JSON, nothing else.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.3 }
      })
    }
  );
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts
    ?.filter(p => p.text)
    ?.map(p => p.text)
    ?.join("") || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export default function FashionTracker() {
  const [brands, setBrands] = useState(DEFAULT_BRANDS);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brandData, setBrandData] = useState({});
  const [loading, setLoading] = useState({});
  const [view, setView] = useState("home"); // home | detail | add
  const [searchText, setSearchText] = useState("");
  const [addInput, setAddInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [toast, setToast] = useState(null);
  const inputRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const loadBrandData = async (brand) => {
    if (brandData[brand.id] || loading[brand.id]) return;
    setLoading(l => ({ ...l, [brand.id]: true }));
    try {
      const data = await fetchBrandNews(brand.name);
      setBrandData(d => ({ ...d, [brand.id]: data }));
    } catch {
      setBrandData(d => ({ ...d, [brand.id]: { error: true } }));
    }
    setLoading(l => ({ ...l, [brand.id]: false }));
  };

  const openBrand = (brand) => {
    setSelectedBrand(brand);
    setView("detail");
    loadBrandData(brand);
  };

  const addBrand = (name) => {
    if (!name.trim()) return;
    if (brands.find(b => b.name.toLowerCase() === name.toLowerCase())) {
      showToast("品牌已在追蹤清單中");
      return;
    }
    const color = BRAND_COLORS[brands.length % BRAND_COLORS.length];
    const newBrand = {
      id: Date.now(),
      name: name.trim(),
      logo: name.trim().slice(0, 2).toUpperCase(),
      color,
    };
    setBrands(b => [...b, newBrand]);
    setAddInput("");
    setView("home");
    showToast(`已新增 ${name.trim()}`);
  };

  const removeBrand = (id) => {
    setBrands(b => b.filter(br => br.id !== id));
    setBrandData(d => { const n = { ...d }; delete n[id]; return n; });
    setView("home");
    showToast("已移除品牌");
  };

  const refreshBrand = (brand) => {
    setBrandData(d => { const n = { ...d }; delete n[brand.id]; return n; });
    loadBrandData(brand);
  };

  const filteredSuggestions = POPULAR_BRANDS.filter(b =>
    b.toLowerCase().includes(addInput.toLowerCase()) &&
    !brands.find(br => br.name.toLowerCase() === b.toLowerCase())
  );

  return (
    <div style={{
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      background: "#0A0A0A",
      minHeight: "100vh",
      maxWidth: 390,
      margin: "0 auto",
      position: "relative",
      overflow: "hidden",
      color: "#fff",
    }}>
      {/* Status Bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 20px 0", fontSize: 12, fontWeight: 600, color: "#fff",
      }}>
        <span>9:41</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span>●●●</span>
          <span>WiFi</span>
          <span>🔋</span>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.15)", backdropFilter: "blur(20px)",
          borderRadius: 20, padding: "10px 20px", fontSize: 13,
          color: "#fff", zIndex: 9999, whiteSpace: "nowrap",
          border: "1px solid rgba(255,255,255,0.1)",
          animation: "fadeIn 0.3s ease",
        }}>
          {toast}
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(-8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { display: none; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* HOME VIEW */}
      {view === "home" && (
        <div style={{ padding: "20px 20px 100px", animation: "slideUp 0.3s ease" }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 13, color: "#888", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
              Fashion Radar
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: -1 }}>
              新品追蹤
            </h1>
          </div>

          {/* Search */}
          <div style={{
            background: "rgba(255,255,255,0.07)",
            borderRadius: 12, padding: "10px 14px",
            display: "flex", alignItems: "center", gap: 8, marginBottom: 24,
          }}>
            <span style={{ fontSize: 14, color: "#666" }}>🔍</span>
            <input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="搜尋品牌..."
              style={{
                background: "none", border: "none", outline: "none",
                color: "#fff", fontSize: 14, width: "100%",
              }}
            />
          </div>

          {/* Brand Grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {brands
              .filter(b => b.name.toLowerCase().includes(searchText.toLowerCase()))
              .map((brand, i) => {
                const data = brandData[brand.id];
                const isLoading = loading[brand.id];
                return (
                  <div
                    key={brand.id}
                    onClick={() => openBrand(brand)}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: 16, padding: "14px 16px",
                      display: "flex", alignItems: "center", gap: 14,
                      cursor: "pointer", border: "1px solid rgba(255,255,255,0.06)",
                      transition: "all 0.2s",
                      animation: `slideUp 0.3s ease ${i * 0.05}s both`,
                    }}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: brand.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 800, color: "#fff",
                      flexShrink: 0, letterSpacing: -0.5,
                    }}>
                      {brand.logo}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{brand.name}</div>
                      <div style={{ fontSize: 12, color: "#666", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {isLoading ? "載入中..." : data?.error ? "無法載入" : data?.summary || "點擊查看新品"}
                      </div>
                    </div>
                    <div style={{ fontSize: 18, color: "#444" }}>›</div>
                  </div>
                );
              })}
          </div>

          {brands.filter(b => b.name.toLowerCase().includes(searchText.toLowerCase())).length === 0 && (
            <div style={{ textAlign: "center", color: "#555", padding: "40px 0" }}>
              找不到品牌
            </div>
          )}
        </div>
      )}

      {/* DETAIL VIEW */}
      {view === "detail" && selectedBrand && (
        <div style={{ animation: "slideUp 0.3s ease" }}>
          {/* Hero Header */}
          <div style={{
            background: `linear-gradient(135deg, ${selectedBrand.color}33, #0A0A0A)`,
            padding: "20px 20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <button onClick={() => setView("home")} style={{
                background: "rgba(255,255,255,0.1)", border: "none",
                color: "#fff", borderRadius: 20, padding: "6px 14px",
                fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
              }}>‹ 返回</button>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => refreshBrand(selectedBrand)} style={{
                  background: "rgba(255,255,255,0.1)", border: "none",
                  color: "#fff", borderRadius: 20, padding: "6px 14px",
                  fontSize: 13, cursor: "pointer",
                }}>↻ 更新</button>
                <button onClick={() => removeBrand(selectedBrand.id)} style={{
                  background: "rgba(255,50,50,0.2)", border: "none",
                  color: "#ff6b6b", borderRadius: 20, padding: "6px 14px",
                  fontSize: 13, cursor: "pointer",
                }}>移除</button>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18,
                background: selectedBrand.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: -1,
              }}>
                {selectedBrand.logo}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>
                  {selectedBrand.name}
                </h2>
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                  {brandData[selectedBrand.id]?.lastUpdated || "最新資訊"}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: "20px 20px 100px" }}>
            {loading[selectedBrand.id] && (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{
                  width: 32, height: 32, border: "3px solid rgba(255,255,255,0.1)",
                  borderTop: `3px solid ${selectedBrand.color}`,
                  borderRadius: "50%", margin: "0 auto 16px",
                  animation: "spin 0.8s linear infinite",
                }} />
                <div style={{ color: "#666", fontSize: 14 }}>正在搜尋最新新品...</div>
              </div>
            )}

            {brandData[selectedBrand.id]?.error && (
              <div style={{
                textAlign: "center", padding: "40px 20px",
                background: "rgba(255,50,50,0.1)", borderRadius: 16,
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>😔</div>
                <div style={{ color: "#ff6b6b", fontSize: 14 }}>無法載入資訊，請稍後重試</div>
              </div>
            )}

            {brandData[selectedBrand.id] && !brandData[selectedBrand.id].error && (
              <>
                {/* Summary */}
                <div style={{
                  background: `${selectedBrand.color}18`,
                  border: `1px solid ${selectedBrand.color}33`,
                  borderRadius: 14, padding: 16, marginBottom: 20,
                }}>
                  <div style={{ fontSize: 11, color: selectedBrand.color, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>本季亮點</div>
                  <div style={{ fontSize: 14, color: "#ddd", lineHeight: 1.6 }}>
                    {brandData[selectedBrand.id].summary}
                  </div>
                </div>

                {/* Items */}
                <div style={{ fontSize: 11, color: "#666", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
                  新品一覽
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {brandData[selectedBrand.id].items?.map((item, i) => (
                    <div key={i} style={{
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 14, padding: "14px 16px",
                      border: "1px solid rgba(255,255,255,0.06)",
                      animation: `slideUp 0.3s ease ${i * 0.07}s both`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>{item.description}</div>
                        </div>
                        <div style={{ marginLeft: 12, flexShrink: 0 }}>
                          <span style={{
                            background: `${selectedBrand.color}33`,
                            color: selectedBrand.color,
                            fontSize: 10, fontWeight: 700,
                            padding: "3px 8px", borderRadius: 8,
                            letterSpacing: 0.5,
                          }}>
                            {item.category}
                          </span>
                        </div>
                      </div>
                      {item.price && (
                        <div style={{ fontSize: 12, color: "#aaa", marginTop: 8 }}>
                          💰 {item.price}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {!brandData[selectedBrand.id] && !loading[selectedBrand.id] && (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <button onClick={() => loadBrandData(selectedBrand)} style={{
                  background: selectedBrand.color, border: "none",
                  color: "#fff", borderRadius: 14, padding: "14px 32px",
                  fontSize: 15, fontWeight: 700, cursor: "pointer",
                }}>
                  搜尋新品
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD BRAND VIEW */}
      {view === "add" && (
        <div style={{ padding: "20px 20px 100px", animation: "slideUp 0.3s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <button onClick={() => setView("home")} style={{
              background: "rgba(255,255,255,0.1)", border: "none",
              color: "#fff", borderRadius: 20, padding: "6px 14px",
              fontSize: 13, cursor: "pointer",
            }}>‹ 返回</button>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>新增品牌</h2>
          </div>

          <div style={{ position: "relative", marginBottom: 24 }}>
            <input
              ref={inputRef}
              value={addInput}
              onChange={e => { setAddInput(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="輸入品牌名稱..."
              style={{
                width: "100%", background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14, padding: "14px 16px",
                color: "#fff", fontSize: 15, outline: "none",
              }}
            />
            {addInput && (
              <button onClick={() => addBrand(addInput)} style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                background: "#fff", border: "none", color: "#000",
                borderRadius: 10, padding: "6px 14px", fontSize: 13,
                fontWeight: 700, cursor: "pointer",
              }}>新增</button>
            )}
          </div>

          {showSuggestions && (
            <>
              <div style={{ fontSize: 11, color: "#666", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
                熱門品牌
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filteredSuggestions.slice(0, 12).map((name, i) => (
                  <div key={name} onClick={() => addBrand(name)} style={{
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 12, padding: "12px 16px",
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", cursor: "pointer",
                    border: "1px solid rgba(255,255,255,0.06)",
                    animation: `slideUp 0.2s ease ${i * 0.03}s both`,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{name}</span>
                    <span style={{ color: "#444", fontSize: 18 }}>+</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Bottom Tab Bar */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 390,
        background: "rgba(10,10,10,0.9)", backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        display: "flex", justifyContent: "space-around",
        padding: "12px 0 24px",
      }}>
        <button onClick={() => setView("home")} style={{
          background: "none", border: "none", color: view === "home" ? "#fff" : "#555",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          cursor: "pointer", fontSize: 10, fontWeight: 600,
        }}>
          <span style={{ fontSize: 22 }}>🏠</span>
          追蹤清單
        </button>
        <button onClick={() => { setView("add"); setAddInput(""); setShowSuggestions(true); }} style={{
          background: "none", border: "none", color: view === "add" ? "#fff" : "#555",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          cursor: "pointer", fontSize: 10, fontWeight: 600,
        }}>
          <span style={{ fontSize: 22 }}>➕</span>
          新增品牌
        </button>
      </div>
    </div>
  );
}
