// --------- 分頁一:行程紀錄頁 ---------
import { useEffect, useState } from "react";
import {
    MapContainer,
    Marker,
    Polyline,
    Popup,
    TileLayer,
    useMap,
    useMapEvents,
} from "react-leaflet";
import { Check, MapPin, Trash2, X } from "lucide-react";
import L from "leaflet";
import storage from "../utils/storage";

// Leaflet marker 圖示修正
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadowUrl from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = new L.Icon({
    iconUrl,
    shadowUrl: iconShadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const defaultCenter = [23.7, 121];

// 讓地圖飛到指定座標的元件
function FlyToLocation({ position }) {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.setView(position, 13);
        }
    }, [position, map]);

    return null;
}

// 點擊地圖新增標記
function ClickHandler({ onAddMarker }) {
    useMapEvents({
        click(e) {
            onAddMarker(e.latlng);
        },
    });
    return null;
}

export default function TravelPage() {
    const [note, setNote] = useState("");
    const [markers, setMarkers] = useState([]);
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [showRoute, setShowRoute] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");

    // 🔍 搜尋相關 state
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [searchTarget, setSearchTarget] = useState(null); // 給 FlyToLocation
    const [searchResults, setSearchResults] = useState([]); // 候選地點列表

    // 📅 篩選相關 state：全部 / 單一天 / 區間
    const [filterMode, setFilterMode] = useState("all"); // 'all' | 'single' | 'range'
    const [filterDate, setFilterDate] = useState("");
    const [filterStart, setFilterStart] = useState("");
    const [filterEnd, setFilterEnd] = useState("");

    useEffect(() => {
        const loadMarkers = async () => {
            try {
                const result = await storage.get("travel_markers");
                if (result && result.value) {
                    const parsed = JSON.parse(result.value);
                    if (Array.isArray(parsed)) {
                        setMarkers(parsed);
                    }
                }
            } catch (err) {
                console.log(
                    "首次使用,尚無行程記錄 (error info)：",
                    err?.message ?? err
                );
            }
        };
        loadMarkers();
    }, []);

    const saveMarkers = async (newMarkers) => {
        setMarkers(newMarkers);
        try {
            await storage.set("travel_markers", JSON.stringify(newMarkers));
        } catch (err) {
            console.error("儲存行程失敗", err);
        }
    };

    const handleAddMarker = (latlng) => {
        if (!note.trim()) {
            alert("請先輸入這次行程的備註,再點地圖。");
            return;
        }

        const newMarker = {
            id: Date.now(),
            position: [latlng.lat, latlng.lng],
            text: note.trim(),
            date: selectedDate,
            timestamp: Date.now(),
        };

        const updated = [...markers, newMarker];
        saveMarkers(updated);
        setNote("");
    };

    const deleteMarker = (id) => {
        if (window.confirm("確定要刪除這個行程點嗎?")) {
            const updated = markers.filter((m) => m.id !== id);
            saveMarkers(updated);
        }
    };

    const startEdit = (marker) => {
        setEditingId(marker.id);
        setEditText(marker.text);
    };

    const saveEdit = () => {
        if (editingId == null) return;
        const updated = markers.map((m) =>
            m.id === editingId ? { ...m, text: editText.trim() } : m
        );
        saveMarkers(updated);
        setEditingId(null);
        setEditText("");
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditText("");
    };

    const clearMarkers = () => {
        if (window.confirm("確定要清除所有行程紀錄嗎?")) {
            saveMarkers([]);
        }
    };

    // 🔍 搜尋 API：找多筆候選地點
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setSearchError("");
        setSearchResults([]);
        setSearchTarget(null);

        try {
            const resp = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&accept-language=zh-TW&q=${encodeURIComponent(
                    searchQuery.trim()
                )}`
            );
            const data = await resp.json();

            if (!Array.isArray(data) || data.length === 0) {
                setSearchError("找不到這個地點，換個關鍵字試看看～");
                return;
            }

            const results = data.map((item, idx) => ({
                id: item.place_id ?? idx,
                name: item.display_name,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon),
            }));
            setSearchResults(results);
        } catch (error) {
            console.error("搜尋失敗：", error);
            setSearchError("搜尋失敗，可能是網路或服務暫時有問題。");
        } finally {
            setIsSearching(false);
        }
    };

    // 🔍 點選某一個搜尋結果 → 飛過去 + 幫你加 marker
    const handleSelectResult = (result) => {
        const position = [result.lat, result.lon];
        setSearchTarget(position);

        // 文字優先用你現在打在 note 裡的內容，沒有就用地點名稱
        const text = note.trim() || simplifyPlaceName(result.name);

        const newMarker = {
            id: Date.now(),
            position,
            text,
            date: selectedDate,
            timestamp: Date.now(),
        };

        const updated = [...markers, newMarker];
        saveMarkers(updated);

        // 使用後清理一下 UI
        setNote(""); // 用完就清空備註，讓你下一筆可以重寫
        setSearchResults([]);
        setSearchError("");
    };

    // 把 Nominatim 的超長地點名稱變得短一點，人性化顯示
    const simplifyPlaceName = (full) => {
        if (!full) return "";
        const parts = full.split(",");
        if (parts.length === 0) return full;
        return parts[0].trim();
    };

    // 📅 根據 filterMode 做日期篩選
    const filteredMarkers = markers.filter((m) => {
        if (filterMode === "all") return true;

        if (filterMode === "single") {
            if (!filterDate) return true; // 還沒選日期時，先顯示全部
            return m.date === filterDate;
        }

        if (filterMode === "range") {
            if (!filterStart || !filterEnd) return true;
            // 日期是 YYYY-MM-DD 字串，可以直接用字典順序比較
            return m.date >= filterStart && m.date <= filterEnd;
        }

        return true;
    });

    // 路線座標：用「篩選後」的點來畫
    const routeCoordinates =
        showRoute && filteredMarkers.length > 1
            ? [...filteredMarkers]
                .sort((a, b) => a.timestamp - b.timestamp)
                .map((m) => m.position)
            : [];

    // 統計資訊：用「篩選後」的資料來算
    const totalMarkers = filteredMarkers.length;
    const uniqueDates = [...new Set(filteredMarkers.map((m) => m.date))].length;

    return (
        <div
            style={{
                padding: "20px",
                paddingBottom: "12px",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
        >
            {/* 統計卡片 */}
            <div
                style={{
                    display: "flex",
                    gap: "10px",
                    marginBottom: "16px",
                }}
            >
                <div
                    style={{
                        flex: 1,
                        background: "rgba(255,255,255,0.95)",
                        borderRadius: "12px",
                        padding: "12px",
                        textAlign: "center",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    }}
                >
                    <div
                        style={{
                            fontSize: "24px",
                            fontWeight: "700",
                            color: "#667eea",
                        }}
                    >
                        {totalMarkers}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>景點數（目前視圖）</div>
                </div>
                <div
                    style={{
                        flex: 1,
                        background: "rgba(255,255,255,0.95)",
                        borderRadius: "12px",
                        padding: "12px",
                        textAlign: "center",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    }}
                >
                    <div
                        style={{
                            fontSize: "24px",
                            fontWeight: "700",
                            color: "#764ba2",
                        }}
                    >
                        {uniqueDates}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>天數（目前視圖）</div>
                </div>
            </div>

            {/* 標題與控制 */}
            <div style={{ marginBottom: "16px" }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        marginBottom: "12px",
                    }}
                >
                    <h2
                        style={{
                            fontSize: "24px",
                            margin: 0,
                            color: "#fff",
                            fontWeight: "700",
                            textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <MapPin size={24} />
                        旅遊行程紀錄
                    </h2>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            onClick={() => setShowRoute(!showRoute)}
                            style={{
                                border: "none",
                                background: showRoute
                                    ? "rgba(255,255,255,0.3)"
                                    : "rgba(255,255,255,0.2)",
                                color: "#fff",
                                fontSize: "12px",
                                padding: "6px 12px",
                                borderRadius: "20px",
                                cursor: "pointer",
                                backdropFilter: "blur(10px)",
                                transition: "all 0.3s ease",
                            }}
                        >
                            {showRoute ? "隱藏" : "顯示"}路線
                        </button>
                        {markers.length > 0 && (
                            <button
                                onClick={clearMarkers}
                                style={{
                                    border: "none",
                                    background: "rgba(255,255,255,0.2)",
                                    color: "#fff",
                                    fontSize: "12px",
                                    padding: "6px 12px",
                                    borderRadius: "20px",
                                    cursor: "pointer",
                                    backdropFilter: "blur(10px)",
                                    transition: "all 0.3s ease",
                                }}
                            >
                                <Trash2
                                    size={14}
                                    style={{
                                        display: "inline",
                                        marginRight: "4px",
                                    }}
                                />
                                清除全部
                            </button>
                        )}
                    </div>
                </div>

                <p
                    style={{
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.9)",
                        margin: "0 0 12px",
                        fontWeight: "300",
                    }}
                >
                    💡 選擇日期、輸入描述,再「點地圖」或「用搜尋結果」來標記位置
                </p>

                {/* 新增行程用的日期（不影響篩選） */}
                <div style={{ marginBottom: "12px" }}>
                    <label
                        style={{
                            display: "block",
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.8)",
                            marginBottom: "4px",
                        }}
                    >
                        新增行程的日期
                    </label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{
                            width: "90%",
                            padding: "12px",
                            borderRadius: "12px",
                            border: "none",
                            fontSize: "14px",
                            background: "rgba(255,255,255,0.95)",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                            outline: "none",
                        }}
                    />
                </div>

                <textarea
                    name="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="例: 台中歌劇院,看展+吃燒肉飯 😋 (也可以先打要做的事，再用搜尋選點)"
                    style={{
                        width: "100%",
                        minHeight: "70px",
                        padding: "14px",
                        borderRadius: "12px",
                        border: "none",
                        fontSize: "14px",
                        resize: "none",
                        background: "rgba(255,255,255,0.95)",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        outline: "none",
                        transition: "all 0.3s ease",
                    }}
                    onFocus={(e) => {
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow =
                            "0 6px 12px rgba(0,0,0,0.15)";
                    }}
                    onBlur={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow =
                            "0 4px 6px rgba(0,0,0,0.1)";
                    }}
                />

                {/* 已紀錄行程列表（使用篩選後的資料） */}
                {filteredMarkers.length > 0 && (
                    <div
                        style={{
                            marginTop: "16px",
                            background: "rgba(255,255,255,0.95)",
                            borderRadius: "12px",
                            padding: "14px",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        }}
                    >
                        <h3
                            style={{
                                fontSize: "15px",
                                margin: "0 0 10px",
                                color: "#667eea",
                                fontWeight: "600",
                            }}
                        >
                            📝 已紀錄行程（依目前篩選）
                        </h3>
                        <ul
                            style={{
                                listStyle: "none",
                                paddingLeft: 0,
                                margin: 0,
                                fontSize: "13px",
                                maxHeight: "120px",
                                overflowY: "auto",
                            }}
                        >
                            {[...filteredMarkers]
                                .sort((a, b) => b.timestamp - a.timestamp)
                                .map((m) => (
                                    <li
                                        key={m.id}
                                        style={{
                                            marginBottom: "8px",
                                            padding: "8px",
                                            background: "#f8f9fa",
                                            borderRadius: "8px",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        {editingId === m.id ? (
                                            <div
                                                style={{
                                                    flex: 1,
                                                    display: "flex",
                                                    gap: "8px",
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={editText}
                                                    onChange={(e) =>
                                                        setEditText(e.target.value)
                                                    }
                                                    style={{
                                                        flex: 1,
                                                        padding: "4px 8px",
                                                        borderRadius: "6px",
                                                        border: "1px solid #ddd",
                                                        fontSize: "13px",
                                                    }}
                                                />
                                                <button
                                                    onClick={saveEdit}
                                                    style={{
                                                        border: "none",
                                                        background: "#4caf50",
                                                        color: "#fff",
                                                        borderRadius: "6px",
                                                        padding: "4px 8px",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <Check size={14} />
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    style={{
                                                        border: "none",
                                                        background: "#f44336",
                                                        color: "#fff",
                                                        borderRadius: "6px",
                                                        padding: "4px 8px",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{ flex: 1 }}>
                                                    <div
                                                        style={{
                                                            color: "#555",
                                                            lineHeight: "1.5",
                                                        }}
                                                    >
                                                        {m.text}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: "11px",
                                                            color: "#999",
                                                            marginTop: "4px",
                                                        }}
                                                    >
                                                        {m.date}
                                                    </div>
                                                </div>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: "6px",
                                                    }}
                                                >
                                                    <button
                                                        onClick={() => startEdit(m)}
                                                        style={{
                                                            border: "none",
                                                            background:
                                                                "transparent",
                                                            color: "#667eea",
                                                            fontSize: "11px",
                                                            cursor: "pointer",
                                                            padding: "2px 6px",
                                                        }}
                                                    >
                                                        編輯
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            deleteMarker(m.id)
                                                        }
                                                        style={{
                                                            border: "none",
                                                            background:
                                                                "transparent",
                                                            color: "#f44336",
                                                            fontSize: "11px",
                                                            cursor: "pointer",
                                                            padding: "2px 6px",
                                                        }}
                                                    >
                                                        刪除
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* 📅 篩選控制：全部 / 單一天 / 區間 */}
            <div
                style={{
                    marginTop: "8px",
                    marginBottom: "4px",
                    background: "rgba(255,255,255,0.16)",
                    borderRadius: "12px",
                    padding: "8px 10px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                        gap: "8px",
                    }}
                >
                    <span
                        style={{
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.9)",
                        }}
                    >
                        顯示範圍
                    </span>
                    <div
                        style={{
                            display: "flex",
                            gap: "6px",
                            fontSize: "12px",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setFilterMode("all")}
                            style={{
                                border: "none",
                                borderRadius: "999px",
                                padding: "4px 10px",
                                background:
                                    filterMode === "all"
                                        ? "rgba(255,255,255,0.9)"
                                        : "rgba(255,255,255,0.2)",
                                color:
                                    filterMode === "all" ? "#4f46e5" : "#f1f5f9",
                                cursor: "pointer",
                            }}
                        >
                            全部
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterMode("single")}
                            style={{
                                border: "none",
                                borderRadius: "999px",
                                padding: "4px 10px",
                                background:
                                    filterMode === "single"
                                        ? "rgba(255,255,255,0.9)"
                                        : "rgba(255,255,255,0.2)",
                                color:
                                    filterMode === "single" ? "#4f46e5" : "#f1f5f9",
                                cursor: "pointer",
                            }}
                        >
                            單一天
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterMode("range")}
                            style={{
                                border: "none",
                                borderRadius: "999px",
                                padding: "4px 10px",
                                background:
                                    filterMode === "range"
                                        ? "rgba(255,255,255,0.9)"
                                        : "rgba(255,255,255,0.2)",
                                color:
                                    filterMode === "range" ? "#4f46e5" : "#f1f5f9",
                                cursor: "pointer",
                            }}
                        >
                            區間
                        </button>
                    </div>
                </div>

                {/* 單一天 */}
                {filterMode === "single" && (
                    <div style={{ marginTop: "4px" }}>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "8px",
                                borderRadius: "8px",
                                border: "none",
                                fontSize: "13px",
                                background: "rgba(255,255,255,0.95)",
                            }}
                        />
                    </div>
                )}

                {/* 區間 */}
                {filterMode === "range" && (
                    <div
                        style={{
                            display: "flex",
                            gap: "6px",
                            marginTop: "4px",
                            fontSize: "12px",
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <div
                                style={{
                                    color: "rgba(255,255,255,0.8)",
                                    marginBottom: "2px",
                                }}
                            >
                                起
                            </div>
                            <input
                                type="date"
                                value={filterStart}
                                onChange={(e) => setFilterStart(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    borderRadius: "8px",
                                    border: "none",
                                    fontSize: "13px",
                                    background: "rgba(255,255,255,0.95)",
                                }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div
                                style={{
                                    color: "rgba(255,255,255,0.8)",
                                    marginBottom: "2px",
                                }}
                            >
                                迄
                            </div>
                            <input
                                type="date"
                                value={filterEnd}
                                onChange={(e) => setFilterEnd(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    borderRadius: "8px",
                                    border: "none",
                                    fontSize: "13px",
                                    background: "rgba(255,255,255,0.95)",
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* 地點搜尋 + 搜尋結果列表 */}
            <div
                style={{
                    marginTop: "8px",
                    marginBottom: "8px",
                }}
            >
                <form
                    onSubmit={handleSearch}
                    style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        marginBottom: "4px",
                    }}
                >
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="🔍 搜尋地點，例如：台北、台中車站、六合夜市⋯"
                        style={{
                            flex: 1,
                            padding: "8px 10px",
                            borderRadius: "10px",
                            border: "none",
                            fontSize: "13px",
                            background: "rgba(255,255,255,0.95)",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            outline: "none",
                        }}
                    />
                    <button
                        type="submit"
                        disabled={isSearching}
                        style={{
                            padding: "8px 12px",
                            borderRadius: "10px",
                            border: "none",
                            background: "#4f46e5",
                            color: "#fff",
                            fontSize: "13px",
                            cursor: "pointer",
                            opacity: isSearching ? 0.7 : 1,
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                    >
                        {isSearching ? "搜尋中…" : "搜尋"}
                    </button>
                </form>

                {searchError && (
                    <div
                        style={{
                            fontSize: "12px",
                            color: "#ffeaea",
                            marginTop: "2px",
                        }}
                    >
                        {searchError}
                    </div>
                )}

                {searchResults.length > 0 && (
                    <div
                        style={{
                            marginTop: "6px",
                            maxHeight: "140px",
                            overflowY: "auto",
                            background: "rgba(255,255,255,0.96)",
                            borderRadius: "10px",
                            boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                            padding: "6px 4px",
                        }}
                    >
                        {searchResults.map((r) => {
                            const parts = r.name.split(",");
                            const title = parts[0]?.trim() || r.name;
                            const subtitle = parts.slice(1).join(",").trim();
                            return (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => handleSelectResult(r)}
                                    style={{
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "6px 10px",
                                        border: "none",
                                        background: "transparent",
                                        cursor: "pointer",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "13px",
                                            color: "#333",
                                        }}
                                    >
                                        {title}
                                    </div>
                                    {subtitle && (
                                        <div
                                            style={{
                                                fontSize: "11px",
                                                color: "#888",
                                                marginTop: "2px",
                                            }}
                                        >
                                            {subtitle}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 地圖 */}
            <div
                style={{
                    flex: 1,
                    minHeight: "200px",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                }}
            >
                <MapContainer
                    center={defaultCenter}
                    zoom={7}
                    scrollWheelZoom={true}
                    style={{ width: "100%", height: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> 貢獻者'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* 地圖點擊新增 marker */}
                    <ClickHandler onAddMarker={handleAddMarker} />

                    {/* 搜尋到的地點，讓地圖飛過去 */}
                    {searchTarget && <FlyToLocation position={searchTarget} />}

                    {/* 路線（使用篩選後的點） */}
                    {routeCoordinates.length > 1 && (
                        <Polyline
                            positions={routeCoordinates}
                            color="#667eea"
                            weight={3}
                            opacity={0.7}
                            dashArray="10, 10"
                        />
                    )}

                    {/* 現有標記（使用篩選後的點） */}
                    {filteredMarkers.map((m) => (
                        <Marker key={m.id} position={m.position} icon={defaultIcon}>
                            <Popup>
                                <div style={{ fontSize: "13px" }}>
                                    <strong>{m.text}</strong>
                                    <div
                                        style={{
                                            fontSize: "11px",
                                            color: "#666",
                                            marginTop: "4px",
                                        }}
                                    >
                                        {m.date}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}