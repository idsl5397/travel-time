// --------- 分頁二:行李清單頁 ---------
import {useEffect, useState} from "react";
import {Package, Plus, Trash2} from "lucide-react";
import storage from "../utils/storage";

export default function PackingPage() {
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
                console.log("首次使用,載入預設清單 (error info)：", err.message);
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