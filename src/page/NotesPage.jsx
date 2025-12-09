// --------- 分頁三:旅遊筆記頁 ---------
import {useEffect, useState} from "react";
import {Check, FileText, Plus, X} from "lucide-react";
import storage from "../utils/storage";

export default function NotesPage() {
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
                console.log("首次使用,尚無筆記 (error info)：", err.message);
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
                    id="notes"
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
                                            id={note.id}
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