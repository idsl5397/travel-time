// --------- 分頁一:行程紀錄頁 ---------
import {useEffect, useState} from "react";
import {MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents} from "react-leaflet";
import {Check, MapPin, Trash2, X} from "lucide-react";
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

export default function TravelPage() {
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
                console.log("首次使用,尚無行程記錄 (error info)：", err.message);
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