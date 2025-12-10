// --------- 分頁一:行程紀錄頁（Google Maps 版 + 必須按「建立」） ---------
import { useEffect, useState } from "react";
import {
    GoogleMap,
    Marker,
    Polyline,
    Autocomplete,
    useJsApiLoader,
} from "@react-google-maps/api";
import { Check, MapPin, Trash2, X } from "lucide-react";
import storage from "../utils/storage";

const defaultCenter = { lat: 23.7, lng: 121 }; // 台灣中間偏右

const mapContainerStyle = {
    width: "100%",
    height: "100%",
};
const libraries = ["places"];

export default function TravelPage() {
    const [note, setNote] = useState("");
    const [markers, setMarkers] = useState([]);
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [selectedTime, setSelectedTime] = useState(
        new Date().toTimeString().slice(0, 5) // "HH:MM"
    );

    const [showRoute, setShowRoute] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");

    // 搜尋 / 地點選擇相關
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [autocomplete, setAutocomplete] = useState(null);

    // 暫存「選好的地點」，要按「建立」才會真的變成行程
    const [pendingPosition, setPendingPosition] = useState(null); // { lat, lng } | null
    const [pendingLabel, setPendingLabel] = useState(""); // 給 UI 顯示

    // 地圖物件
    const [mapRef, setMapRef] = useState(null);

    // 篩選：全部 / 單一天 / 區間
    const [filterMode, setFilterMode] = useState("all"); // 'all' | 'single' | 'range'
    const [filterDate, setFilterDate] = useState("");
    const [filterStart, setFilterStart] = useState("");
    const [filterEnd, setFilterEnd] = useState("");

    // 載入 Google Maps Script
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: libraries,
    });

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

    // ✅ 真正「建立行程」的動作：一定要有 note + pendingPosition
    const handleCreateMarker = () => {
        if (!note.trim()) {
            alert("請先輸入這次行程的事由（要做什麼 / 跟誰 / 有什麼特別）。");
            return;
        }
        if (!pendingPosition) {
            alert("請先在地圖點一下，或用上方搜尋選一個地點。");
            return;
        }

        const newMarker = {
            id: Date.now(),
            position: [pendingPosition.lat, pendingPosition.lng],
            text: note.trim(),         // 事由
            date: selectedDate,        // 日期
            time: selectedTime,        // 🕒 新增：時間
            location: pendingLabel,    // 📍 新增：地點名稱（或你暫存的文字）
            timestamp: Date.now(),
        };

        const updated = [...markers, newMarker];
        saveMarkers(updated);

        // 建立完成後，清掉事由與暫存地點，但保留日期與時間
        setNote("");
        setPendingPosition(null);
        setPendingLabel("");
    };

    // 地圖點擊：只設定「暫存地點」，不會直接新增行程
    const handleMapClick = (e) => {
        if (!e || !e.latLng) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setPendingPosition({ lat, lng });
        setPendingLabel(`地圖選取點 (${lat.toFixed(5)}, ${lng.toFixed(5)})`);

        if (mapRef) {
            mapRef.panTo({ lat, lng });
            mapRef.setZoom(13);
        }
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

    // Autocomplete 載入
    const onAutocompleteLoad = (ac) => {
        setAutocomplete(ac);
    };

    // 選定地點：只設定暫存地點，不直接新增
    const onPlaceChanged = () => {
        if (!autocomplete) return;
        setIsSearching(true);
        setSearchError("");

        const place = autocomplete.getPlace();

        if (!place || !place.geometry || !place.geometry.location) {
            setSearchError("這個地點沒有座標資訊，換個關鍵字試試看～");
            setIsSearching(false);
            return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const name = place.name || place.formatted_address || "";

        setPendingPosition({ lat, lng });
        setPendingLabel(name || `選取地點 (${lat.toFixed(5)}, ${lng.toFixed(5)})`);

        if (mapRef) {
            mapRef.panTo({ lat, lng });
            mapRef.setZoom(13);
        }

        setIsSearching(false);
    };

    // 日期篩選
    const filteredMarkers = markers.filter((m) => {
        if (filterMode === "all") return true;

        if (filterMode === "single") {
            if (!filterDate) return true;
            return m.date === filterDate;
        }

        if (filterMode === "range") {
            if (!filterStart || !filterEnd) return true;
            return m.date >= filterStart && m.date <= filterEnd;
        }

        return true;
    });

    // 先依日期 + 時間 + timestamp 排序
    const sortedForRoute = [...filteredMarkers].sort((a, b) => {
        if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
        }
        if (a.time && b.time && a.time !== b.time) {
            return a.time.localeCompare(b.time);
        }
        return (a.timestamp || 0) - (b.timestamp || 0);
    });

    // 真正畫在地圖上的 path
    const routePath =
        showRoute && sortedForRoute.length > 1
            ? sortedForRoute.map((m) => ({
                lat: m.position[0],
                lng: m.position[1],
            }))
            : [];


    // 統計
    const totalMarkers = filteredMarkers.length;
    const uniqueDates = [...new Set(filteredMarkers.map((m) => m.date))].length;

    // Google Map 載入狀態
    if (loadError) {
        return (
            <div style={{ color: "#fff", padding: 16 }}>
                地圖載入失敗，請稍後再試。
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div style={{ color: "#fff", padding: 16 }}>
                地圖載入中…
            </div>
        );
    }

    return (
        <div
            style={{
                padding: "20px",
                paddingBottom: "12px",
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
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
            <div style={{marginBottom: "16px"}}>
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
                        <MapPin size={24}/>
                        旅遊行程紀錄（Google Maps）
                    </h2>
                    <div style={{display: "flex", gap: "8px"}}>
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
                    💡 <b>流程：</b> 先選日期 → 輸入事由 → 點地圖或用搜尋選地點 → 按「建立行程」。
                </p>

                {/* 新增行程用的日期跟時間 */}
                <div
                    style={{
                        marginBottom: "12px",
                        display: "flex",
                        gap: "10px",
                    }}
                >
                    {/* 日期 */}
                    <div style={{flex: 1}}>
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
                                width: "100%",
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

                    {/* 時間 */}
                    <div style={{width: "120px"}}>
                        <label
                            style={{
                                display: "block",
                                fontSize: "12px",
                                color: "rgba(255,255,255,0.8)",
                                marginBottom: "4px",
                            }}
                        >
                            時間
                        </label>
                        <input
                            type="time"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            style={{
                                width: "100%",
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
                </div>

                {/* 事由輸入 */}
                <textarea
                    name="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="例: 台中歌劇院，看展＋吃燒肉飯 😋（寫你要做什麼 / 跟誰 / 或心情）"
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
                                                    <Check size={14}/>
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
                                                    <X size={14}/>
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{flex: 1}}>
                                                    {/* 事由 */}
                                                    <div
                                                        style={{
                                                            color: "#555",
                                                            lineHeight: "1.5",
                                                        }}
                                                    >
                                                        {m.text}
                                                    </div>

                                                    {/* 日期 + 時間 */}
                                                    <div
                                                        style={{
                                                            fontSize: "11px",
                                                            color: "#999",
                                                            marginTop: "4px",
                                                        }}
                                                    >
                                                        📅 {m.date}
                                                        {m.time ? ` 🕒 ${m.time}` : ""}
                                                    </div>

                                                    {/* 地點 */}
                                                    <div
                                                        style={{
                                                            fontSize: "11px",
                                                            color: "#666",
                                                            marginTop: "2px",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                        }}
                                                        title={m.location || ""}
                                                    >
                                                        📍 {m.location || "未記錄地點"}
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
                                                            background: "transparent",
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
                                                            background: "transparent",
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

            {/* 篩選控制 */}
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

            {/* 搜尋 + 建立行程區塊 */}
            <div
                style={{
                    marginTop: "8px",
                    marginBottom: "8px",
                    background: "rgba(255,255,255,0.18)",
                    borderRadius: "12px",
                    padding: "8px 10px",
                }}
            >
                {/* 搜尋列 */}
                <div
                    style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        marginBottom: "6px",
                    }}
                >
                    <Autocomplete
                        onLoad={onAutocompleteLoad}
                        onPlaceChanged={onPlaceChanged}
                    >
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="🔍 搜尋地點，例如：台北車站、六合夜市、台南美術館⋯"
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
                    </Autocomplete>
                    <button
                        type="button"
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
                        onClick={onPlaceChanged}
                    >
                        {isSearching ? "搜尋中…" : "搜尋"}
                    </button>
                </div>

                {/* 目前選擇地點 + 建立按鈕 */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        marginTop: "4px",
                    }}
                >
                    <div
                        style={{
                            flex: 1,
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.9)",
                        }}
                    >
                        目前選擇地點：
                        <span
                            style={{
                                fontWeight: "600",
                                color: pendingPosition
                                    ? "#e0f2fe"
                                    : "rgba(255,255,255,0.7)",
                            }}
                        >
                            {pendingPosition ? pendingLabel || "已選擇" : "尚未選擇"}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleCreateMarker}
                        style={{
                            border: "none",
                            borderRadius: "999px",
                            padding: "6px 12px",
                            fontSize: "13px",
                            background:
                                pendingPosition && note.trim()
                                    ? "#22c55e"
                                    : "rgba(148,163,184,0.7)",
                            color: "#fff",
                            cursor:
                                pendingPosition && note.trim()
                                    ? "pointer"
                                    : "not-allowed",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                            whiteSpace: "nowrap",
                        }}
                    >
                        建立行程
                    </button>
                </div>

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
            </div>

            {/* Google Map */}
            <div
                style={{
                    height: "320px",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                }}
            >
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={defaultCenter}
                    zoom={7}
                    onLoad={(map) => setMapRef(map)}
                    onClick={handleMapClick}
                    options={{
                        fullscreenControl: false,
                        streetViewControl: false,
                        mapTypeControl: false,
                    }}
                >
                    {/* 暫存選擇地點 (pending marker) */}
                    {pendingPosition && (
                        <Marker
                            position={pendingPosition}
                            icon={{
                                path: window.google.maps.SymbolPath.CIRCLE,
                                scale: 8,
                                fillColor: "#22c55e",
                                fillOpacity: 0.9,
                                strokeColor: "#ffffff",
                                strokeWeight: 2,
                            }}
                        />
                    )}

                    {/* 路線 */}
                    {routePath.length > 1 && (
                        <Polyline
                            key={`route-${filteredMarkers.length}-${filteredMarkers.map(m => m.id).sort().join('-')}`}
                            path={routePath}
                            options={{
                                strokeColor: "#667eea",
                                strokeOpacity: 0.8,
                                strokeWeight: 3,
                            }}
                        />
                    )}

                    {/* 已建立行程 marker */}
                    {filteredMarkers.map((m) => (
                        <Marker
                            key={m.id}
                            position={{
                                lat: m.position[0],
                                lng: m.position[1],
                            }}
                            label={{
                                text:
                                    m.text.length > 6
                                        ? m.text.slice(0, 6) + "…"
                                        : m.text,
                                fontSize: "10px",
                            }}
                        />
                    ))}
                </GoogleMap>
            </div>
        </div>
    );
}
