import { useState } from "react";
// import Login from "./components/Login"; // Import the Login component
import {
    MapPin,
    Package,
    FileText,
} from "lucide-react";
import TravelPage from "./page/TravelPage.jsx";
import PackingPage from "./page/PackingPage.jsx";
import NotesPage from "./page/NotesPage.jsx";

// --------- 上層 App:控制分頁切換 ---------
export default function App() {
    const [tab, setTab] = useState("travel");
    // const [isLoggedIn, setIsLoggedIn] = useState(false); // New state for login status

    // const handleLoginSuccess = () => {
    //     setIsLoggedIn(true);
    // };
    //
    // if (!isLoggedIn) {
    //     return <Login onLoginSuccess={handleLoginSuccess} />;
    // }

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
