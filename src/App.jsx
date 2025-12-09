import { useState, useEffect } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
    MapPin,
    Package,
    FileText,
    Trash2,
    Plus,
    Check,
    X,
} from "lucide-react";

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

// === 共用儲存工具：有 window.storage 就用，否則用 localStorage ===
const storage = {
    async get(key) {
        try {
            if (typeof window !== "undefined" && window.storage && typeof window.storage.get === "function") {
                return await window.storage.get(key);
            }
            // fallback: localStorage
            const value = window.localStorage.getItem(key);
            if (value == null) return null;
            return { value };
        } catch (err) {
            console.error("storage.get 錯誤:", err);
            return null;
        }
    },
    async set(key, value) {
        try {
            if (typeof window !== "undefined" && window.storage && typeof window.storage.set === "function") {
                return await window.storage.set(key, value);
            }
            // fallback: localStorage
            window.localStorage.setItem(key, value);
        } catch (err) {
            console.error("storage.set 錯誤:", err);
        }
    },
};

// --------- 分頁一:行程紀錄頁 ---------
function TravelPage() {
    const [note, setNote] = useState("");
    const [markers, setMarkers] = useState([]);
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [showRoute, setShowRoute] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");

    const defaultCenter = [23.7, 121];

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
                console.log("首次使用,尚無行程記錄");
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

    function ClickHandler({ onAddMarker }) {
        useMapEvents({
            click(e) {
                onAddMarker(e.latlng);
            },
        });
        return null;
    }

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

    // 路線座標（用複製後排序，避免直接改 state）
    const routeCoordinates = showRoute
        ? [...markers].sort((a, b) => a.timestamp - b.timestamp).map((m) => m.position)
        : [];

    // 統計資訊
    const totalMarkers = markers.length;
    const uniqueDates = [...new Set(markers.map((m) => m.date))].length;

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
                    <div style={{ fontSize: "12px", color: "#666" }}>景點數</div>
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
                    <div style={{ fontSize: "12px", color: "#666" }}>天數</div>
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
                    💡 選擇日期、輸入描述,再點地圖標記位置
                </p>

                {/* 日期選擇 */}
                <div style={{ marginBottom: "12px" }}>
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

                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="例: 台中歌劇院,看展+吃燒肉飯 😋"
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

                {markers.length > 0 && (
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
                            📝 已紀錄行程
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
                            {[...markers]
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

                    <ClickHandler onAddMarker={handleAddMarker} />

                    {showRoute && routeCoordinates.length > 1 && (
                        <Polyline
                            positions={routeCoordinates}
                            color="#667eea"
                            weight={3}
                            opacity={0.7}
                            dashArray="10, 10"
                        />
                    )}

                    {markers.map((m) => (
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

// --------- 分頁二:行李清單頁 ---------
function PackingPage() {
    const [itemInput, setItemInput] = useState("");
    const [items, setItems] = useState([]);
    const [category, setCategory] = useState("其他");
    const [filterCategory, setFilterCategory] = useState("全部");

    const categories = ["證件", "電子產品", "衣物", "盥洗用品", "藥品", "其他"];

    useEffect(() => {
        const loadItems = async () => {
            try {
                const result = await storage.get("packing_items");
                if (result && result.value) {
                    const parsed = JSON.parse(result.value);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setItems(parsed);
                        return;
                    }
                }
            } catch (err) {
                console.log("首次使用,載入預設清單");
            }

            setItems([
                {
                    id: 1,
                    text: "護照 / 身分證",
                    checked: false,
                    category: "證件",
                },
                {
                    id: 2,
                    text: "錢包(現金+信用卡)",
                    checked: false,
                    category: "證件",
                },
                {
                    id: 3,
                    text: "充電線、行動電源",
                    checked: false,
                    category: "電子產品",
                },
                {
                    id: 4,
                    text: "換洗衣物",
                    checked: false,
                    category: "衣物",
                },
                {
                    id: 5,
                    text: "牙刷牙膏",
                    checked: false,
                    category: "盥洗用品",
                },
            ]);
        };
        loadItems();
    }, []);

    const saveItems = async (newItems) => {
        setItems(newItems);
        try {
            await storage.set("packing_items", JSON.stringify(newItems));
        } catch (err) {
            console.error("儲存行李清單失敗", err);
        }
    };

    const addItem = () => {
        const text = itemInput.trim();
        if (!text) return;

        const updated = [
            ...items,
            { id: Date.now(), text, checked: false, category },
        ];
        saveItems(updated);
        setItemInput("");
    };

    const toggleItem = (id) => {
        const updated = items.map((it) =>
            it.id === id ? { ...it, checked: !it.checked } : it
        );
        saveItems(updated);
    };

    const removeItem = (id) => {
        const updated = items.filter((it) => it.id !== id);
        saveItems(updated);
    };

    const clearItems = () => {
        if (window.confirm("確定要清空行李清單嗎?")) {
            saveItems([]);
        }
    };

    const clearChecked = () => {
        if (window.confirm("確定要清除所有已勾選的項目嗎?")) {
            const updated = items.filter((it) => !it.checked);
            saveItems(updated);
        }
    };

    // 篩選項目
    const filteredItems =
        filterCategory === "全部"
            ? items
            : items.filter((it) => it.category === filterCategory);

    // 統計
    const totalItems = items.length;
    const checkedItems = items.filter((it) => it.checked).length;
    const progress =
        totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    return (
        <div
            style={{
                padding: "20px",
                paddingBottom: "76px",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            }}
        >
            {/* 進度條 */}
            <div
                style={{
                    background: "rgba(255,255,255,0.95)",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom: "16px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                    }}
                >
                    <span
                        style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#333",
                        }}
                    >
                        打包進度
                    </span>
                    <span
                        style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#f5576c",
                        }}
                    >
                        {checkedItems} / {totalItems} ({progress}%)
                    </span>
                </div>
                <div
                    style={{
                        width: "100%",
                        height: "8px",
                        background: "#e0e0e0",
                        borderRadius: "4px",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            width: `${progress}%`,
                            height: "100%",
                            background:
                                "linear-gradient(90deg, #f093fb 0%, #f5576c 100%)",
                            transition: "width 0.3s ease",
                        }}
                    />
                </div>
            </div>

            {/* 標題 */}
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
                    <Package size={24} />
                    要帶的東西
                </h2>
                <div style={{ display: "flex", gap: "8px" }}>
                    {items.some((it) => it.checked) && (
                        <button
                            onClick={clearChecked}
                            style={{
                                border: "none",
                                background: "rgba(255,255,255,0.2)",
                                color: "#fff",
                                fontSize: "12px",
                                padding: "6px 12px",
                                borderRadius: "20px",
                                cursor: "pointer",
                                backdropFilter: "blur(10px)",
                            }}
                        >
                            清除已勾選
                        </button>
                    )}
                    {items.length > 0 && (
                        <button
                            onClick={clearItems}
                            style={{
                                border: "none",
                                background: "rgba(255,255,255,0.2)",
                                color: "#fff",
                                fontSize: "12px",
                                padding: "6px 12px",
                                borderRadius: "20px",
                                cursor: "pointer",
                                backdropFilter: "blur(10px)",
                            }}
                        >
                            <Trash2
                                size={14}
                                style={{
                                    display: "inline",
                                    marginRight: "4px",
                                }}
                            />
                            清空
                        </button>
                    )}
                </div>
            </div>

            <p
                style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.9)",
                    margin: "0 0 16px",
                    fontWeight: "300",
                }}
            >
                ✓ 勾選代表已經收進包包,可以分類管理物品
            </p>

            {/* 分類選擇 */}
            <div
                style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "12px",
                    overflowX: "auto",
                    paddingBottom: "4px",
                }}
            >
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        style={{
                            border: "none",
                            background:
                                category === cat
                                    ? "rgba(255,255,255,0.95)"
                                    : "rgba(255,255,255,0.3)",
                            color: category === cat ? "#f5576c" : "#fff",
                            fontSize: "12px",
                            padding: "6px 12px",
                            borderRadius: "20px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            fontWeight: category === cat ? "600" : "400",
                            transition: "all 0.3s ease",
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* 輸入區 */}
            <div
                style={{
                    display: "flex",
                    marginBottom: "16px",
                    gap: "8px",
                }}
            >
                <input
                    type="text"
                    value={itemInput}
                    onChange={(e) => setItemInput(e.target.value)}
                    placeholder="例:雨傘、相機、藥品⋯"
                    style={{
                        flex: 1,
                        padding: "12px 14px",
                        borderRadius: "12px",
                        border: "none",
                        fontSize: "14px",
                        background: "rgba(255,255,255,0.95)",
                        outline: "none",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") addItem();
                    }}
                />
                <button
                    onClick={addItem}
                    style={{
                        padding: "12px 20px",
                        fontSize: "14px",
                        borderRadius: "12px",
                        border: "none",
                        background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: "600",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                >
                    <Plus size={16} />
                    新增
                </button>
            </div>

            {/* 篩選標籤 */}
            <div
                style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "12px",
                    overflowX: "auto",
                    paddingBottom: "4px",
                }}
            >
                <button
                    onClick={() => setFilterCategory("全部")}
                    style={{
                        border: "none",
                        background:
                            filterCategory === "全部"
                                ? "rgba(255,255,255,0.95)"
                                : "rgba(255,255,255,0.3)",
                        color:
                            filterCategory === "全部" ? "#f5576c" : "#fff",
                        fontSize: "12px",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        fontWeight:
                            filterCategory === "全部" ? "600" : "400",
                    }}
                >
                    全部 ({items.length})
                </button>
                {categories.map((cat) => {
                    const count = items.filter(
                        (it) => it.category === cat
                    ).length;
                    if (count === 0) return null;
                    return (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            style={{
                                border: "none",
                                background:
                                    filterCategory === cat
                                        ? "rgba(255,255,255,0.95)"
                                        : "rgba(255,255,255,0.3)",
                                color:
                                    filterCategory === cat
                                        ? "#f5576c"
                                        : "#fff",
                                fontSize: "12px",
                                padding: "6px 12px",
                                borderRadius: "20px",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                fontWeight:
                                    filterCategory === cat ? "600" : "400",
                            }}
                        >
                            {cat} ({count})
                        </button>
                    );
                })}
            </div>

            {/* 清單 */}
            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    borderRadius: "16px",
                    border: "none",
                    padding: "16px",
                    background: "rgba(255,255,255,0.95)",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                }}
            >
                {filteredItems.length === 0 ? (
                    <p
                        style={{
                            fontSize: "14px",
                            color: "#999",
                            textAlign: "center",
                            marginTop: "40px",
                        }}
                    >
                        {items.length === 0
                            ? "還沒有東西,先新增幾項必備物品吧!"
                            : "此分類目前沒有項目"}
                    </p>
                ) : (
                    <ul
                        style={{
                            listStyle: "none",
                            paddingLeft: 0,
                            margin: 0,
                            fontSize: "15px",
                        }}
                    >
                        {filteredItems.map((it) => (
                            <li
                                key={it.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "12px",
                                    marginBottom: "8px",
                                    borderRadius: "8px",
                                    background: it.checked
                                        ? "#f0f0f0"
                                        : "#fff",
                                    border: "1px solid #e0e0e0",
                                    transition: "all 0.3s ease",
                                }}
                            >
                                <label
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        flex: 1,
                                        textDecoration: it.checked
                                            ? "line-through"
                                            : "none",
                                        color: it.checked ? "#999" : "#333",
                                        cursor: "pointer",
                                        transition: "all 0.3s ease",
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={it.checked}
                                        onChange={() => toggleItem(it.id)}
                                        style={{
                                            width: "18px",
                                            height: "18px",
                                            cursor: "pointer",
                                        }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div>{it.text}</div>
                                        <div
                                            style={{
                                                fontSize: "11px",
                                                color: "#999",
                                                marginTop: "2px",
                                            }}
                                        >
                                            {it.category}
                                        </div>
                                    </div>
                                </label>
                                <button
                                    onClick={() => removeItem(it.id)}
                                    style={{
                                        border: "none",
                                        background: "transparent",
                                        color: "#f5576c",
                                        fontSize: "13px",
                                        cursor: "pointer",
                                        padding: "4px 8px",
                                        transition: "all 0.3s ease",
                                    }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

// --------- 分頁三:旅遊筆記頁 ---------
function NotesPage() {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");

    useEffect(() => {
        const loadNotes = async () => {
            try {
                const result = await storage.get("travel_notes");
                if (result && result.value) {
                    const parsed = JSON.parse(result.value);
                    if (Array.isArray(parsed)) {
                        setNotes(parsed);
                    }
                }
            } catch (err) {
                console.log("首次使用,尚無筆記");
            }
        };
        loadNotes();
    }, []);

    const saveNotes = async (newNotes) => {
        setNotes(newNotes);
        try {
            await storage.set("travel_notes", JSON.stringify(newNotes));
        } catch (err) {
            console.error("儲存筆記失敗", err);
        }
    };

    const addNote = () => {
        const text = newNote.trim();
        if (!text) return;

        const updated = [
            {
                id: Date.now(),
                text,
                date: new Date().toLocaleDateString("zh-TW"),
                timestamp: Date.now(),
            },
            ...notes,
        ];
        saveNotes(updated);
        setNewNote("");
    };

    const deleteNote = (id) => {
        if (window.confirm("確定要刪除這則筆記嗎?")) {
            const updated = notes.filter((n) => n.id !== id);
            saveNotes(updated);
        }
    };

    const startEdit = (note) => {
        setEditingId(note.id);
        setEditText(note.text);
    };

    const saveEdit = () => {
        if (editingId == null) return;
        const updated = notes.map((n) =>
            n.id === editingId ? { ...n, text: editText.trim() } : n
        );
        saveNotes(updated);
        setEditingId(null);
        setEditText("");
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditText("");
    };

    return (
        <div
            style={{
                padding: "20px",
                paddingBottom: "76px",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "16px",
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
                    <FileText size={24} />
                    旅遊筆記
                </h2>
            </div>

            <p
                style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.9)",
                    margin: "0 0 16px",
                    fontWeight: "300",
                }}
            >
                📔 記錄旅途中的心情、美食、趣事
            </p>

            {/* 輸入區 */}
            <div style={{ marginBottom: "16px" }}>
                <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="今天去了哪裡?有什麼有趣的事情發生嗎?🌟"
                    style={{
                        width: "100%",
                        minHeight: "100px",
                        padding: "14px",
                        borderRadius: "12px",
                        border: "none",
                        fontSize: "14px",
                        resize: "vertical",
                        background: "rgba(255,255,255,0.95)",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        outline: "none",
                        marginBottom: "12px",
                    }}
                />
                <button
                    onClick={addNote}
                    style={{
                        width: "100%",
                        padding: "12px",
                        fontSize: "14px",
                        borderRadius: "12px",
                        border: "none",
                        background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: "600",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                    }}
                >
                    <Plus size={16} />
                    新增筆記
                </button>
            </div>

            {/* 筆記列表 */}
            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                }}
            >
                {notes.length === 0 ? (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "40px 20px",
                            background: "rgba(255,255,255,0.95)",
                            borderRadius: "16px",
                            boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                        }}
                    >
                        <p style={{ fontSize: "14px", color: "#999" }}>
                            還沒有任何筆記,開始記錄你的旅程吧!
                        </p>
                    </div>
                ) : (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                        }}
                    >
                        {notes.map((note) => (
                            <div
                                key={note.id}
                                style={{
                                    background: "rgba(255,255,255,0.95)",
                                    borderRadius: "16px",
                                    padding: "16px",
                                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                                }}
                            >
                                {editingId === note.id ? (
                                    <div>
                                        <textarea
                                            value={editText}
                                            onChange={(e) =>
                                                setEditText(e.target.value)
                                            }
                                            style={{
                                                width: "100%",
                                                minHeight: "80px",
                                                padding: "12px",
                                                borderRadius: "8px",
                                                border: "1px solid #ddd",
                                                fontSize: "14px",
                                                resize: "vertical",
                                                marginBottom: "8px",
                                            }}
                                        />
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "8px",
                                            }}
                                        >
                                            <button
                                                onClick={saveEdit}
                                                style={{
                                                    flex: 1,
                                                    padding: "8px",
                                                    border: "none",
                                                    background: "#4caf50",
                                                    color: "#fff",
                                                    borderRadius: "8px",
                                                    cursor: "pointer",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                <Check
                                                    size={16}
                                                    style={{
                                                        display: "inline",
                                                        marginRight: "4px",
                                                    }}
                                                />
                                                儲存
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                style={{
                                                    flex: 1,
                                                    padding: "8px",
                                                    border: "none",
                                                    background: "#f44336",
                                                    color: "#fff",
                                                    borderRadius: "8px",
                                                    cursor: "pointer",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                <X
                                                    size={16}
                                                    style={{
                                                        display: "inline",
                                                        marginRight: "4px",
                                                    }}
                                                />
                                                取消
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                marginBottom: "8px",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: "12px",
                                                    color: "#999",
                                                }}
                                            >
                                                {note.date}
                                            </span>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "12px",
                                                }}
                                            >
                                                <button
                                                    onClick={() => startEdit(note)}
                                                    style={{
                                                        border: "none",
                                                        background: "transparent",
                                                        color: "#667eea",
                                                        fontSize: "12px",
                                                        cursor: "pointer",
                                                        fontWeight: "600",
                                                    }}
                                                >
                                                    編輯
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        deleteNote(note.id)
                                                    }
                                                    style={{
                                                        border: "none",
                                                        background: "transparent",
                                                        color: "#f44336",
                                                        fontSize: "12px",
                                                        cursor: "pointer",
                                                        fontWeight: "600",
                                                    }}
                                                >
                                                    刪除
                                                </button>
                                            </div>
                                        </div>
                                        <p
                                            style={{
                                                fontSize: "14px",
                                                color: "#333",
                                                lineHeight: "1.6",
                                                margin: 0,
                                                whiteSpace: "pre-wrap",
                                            }}
                                        >
                                            {note.text}
                                        </p>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// --------- 上層 App:控制分頁切換 ---------
export default function App() {
    const [tab, setTab] = useState("travel");

    return (
        <div
            style={{
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                background: "#f5f5f5",
            }}
        >
            {/* 上面內容區 */}
            <div style={{ flex: 1, overflow: "hidden" }}>
                {tab === "travel" && <TravelPage />}
                {tab === "packing" && <PackingPage />}
                {tab === "notes" && <NotesPage />}
            </div>

            {/* 底部分頁列 */}
            <nav
                style={{
                    height: "64px",
                    borderTop: "none",
                    display: "flex",
                    background: "#fff",
                    boxShadow: "0 -4px 12px rgba(0,0,0,0.1)",
                }}
            >
                <button
                    onClick={() => setTab("travel")}
                    style={{
                        flex: 1,
                        border: "none",
                        background:
                            tab === "travel"
                                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                                : "transparent",
                        fontSize: "13px",
                        padding: "8px 0",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        color: tab === "travel" ? "#fff" : "#666",
                        fontWeight: tab === "travel" ? "600" : "400",
                    }}
                >
                    <MapPin
                        size={20}
                        style={{
                            display: "block",
                            margin: "0 auto 4px",
                        }}
                    />
                    <div>行程紀錄</div>
                </button>
                <button
                    onClick={() => setTab("packing")}
                    style={{
                        flex: 1,
                        border: "none",
                        background:
                            tab === "packing"
                                ? "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                                : "transparent",
                        fontSize: "13px",
                        padding: "8px 0",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        color: tab === "packing" ? "#fff" : "#666",
                        fontWeight: tab === "packing" ? "600" : "400",
                    }}
                >
                    <Package
                        size={20}
                        style={{
                            display: "block",
                            margin: "0 auto 4px",
                        }}
                    />
                    <div>行李清單</div>
                </button>
                <button
                    onClick={() => setTab("notes")}
                    style={{
                        flex: 1,
                        border: "none",
                        background:
                            tab === "notes"
                                ? "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"
                                : "transparent",
                        fontSize: "13px",
                        padding: "8px 0",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        color: tab === "notes" ? "#fff" : "#666",
                        fontWeight: tab === "notes" ? "600" : "400",
                    }}
                >
                    <FileText
                        size={20}
                        style={{
                            display: "block",
                            margin: "0 auto 4px",
                        }}
                    />
                    <div>旅遊筆記</div>
                </button>
            </nav>
        </div>
    );
}
