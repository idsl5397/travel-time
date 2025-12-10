// src/data/packingTemplates.js

// 通用模板（原本那種，適合一般 2–4 天國內 / 近程旅行）
const basicTemplate = {
    id: "basic",
    name: "通用模板",
    description: "適合一般 2–4 天的國內或近程旅行",
    items: [
        // === 證件 ===
        { id: 1, text: "護照 / 身分證", checked: false, category: "證件" },
        { id: 2, text: "錢包（現金 + 信用卡）", checked: false, category: "證件" },
        { id: 3, text: "健保卡 / 保險卡", checked: false, category: "證件" },
        { id: 4, text: "交通票券 / QR Code", checked: false, category: "證件" },

        // === 電子產品 ===
        { id: 10, text: "手機充電線", checked: false, category: "電子產品" },
        { id: 11, text: "行動電源", checked: false, category: "電子產品" },
        { id: 12, text: "插頭轉接頭（若需要）", checked: false, category: "電子產品" },
        { id: 13, text: "耳機", checked: false, category: "電子產品" },

        // === 衣物 ===
        { id: 20, text: "換洗衣物 2–3 套", checked: false, category: "衣物" },
        { id: 21, text: "內衣褲", checked: false, category: "衣物" },
        { id: 22, text: "外套 / 薄長袖", checked: false, category: "衣物" },
        { id: 23, text: "襪子", checked: false, category: "衣物" },

        // === 盥洗用品 ===
        { id: 30, text: "牙刷牙膏", checked: false, category: "盥洗用品" },
        { id: 31, text: "洗面乳", checked: false, category: "盥洗用品" },
        { id: 32, text: "基礎保養品 / 化妝品", checked: false, category: "盥洗用品" },
        { id: 33, text: "梳子 / 髮圈 / 髮夾", checked: false, category: "盥洗用品" },

        // === 藥品 ===
        { id: 40, text: "腸胃藥", checked: false, category: "藥品" },
        { id: 41, text: "止痛藥", checked: false, category: "藥品" },
        { id: 42, text: "個人慢性病藥物", checked: false, category: "藥品" },

        // === 其他 ===
        { id: 50, text: "雨傘 / 雨衣", checked: false, category: "其他" },
        { id: 51, text: "水壺", checked: false, category: "其他" },
        { id: 52, text: "環保袋 / 購物袋", checked: false, category: "其他" },
        { id: 53, text: "面紙 / 濕紙巾", checked: false, category: "其他" },
        { id: 54, text: "口罩", checked: false, category: "其他" },
    ],
};

// 3 天 2 夜・台灣小旅行
const taiwan3d2nTemplate = {
    id: "taiwan_3d2n",
    name: "3天2夜・台灣小旅行",
    description: "適合台灣週末小旅行、輕裝簡單版",
    items: [
        // === 證件 ===
        { id: 101, text: "身分證 / 駕照", checked: false, category: "證件" },
        { id: 102, text: "悠遊卡 / 一卡通", checked: false, category: "證件" },
        { id: 103, text: "交通票券（高鐵 / 火車 / 客運）", checked: false, category: "證件" },

        // === 電子產品 ===
        { id: 110, text: "手機 + 充電線", checked: false, category: "電子產品" },
        { id: 111, text: "行動電源（充飽）", checked: false, category: "電子產品" },
        { id: 112, text: "相機（可選）", checked: false, category: "電子產品" },

        // === 衣物 ===
        { id: 120, text: "上衣 2–3 件", checked: false, category: "衣物" },
        { id: 121, text: "褲子 / 裙子 1–2 件", checked: false, category: "衣物" },
        { id: 122, text: "內衣褲 3 套", checked: false, category: "衣物" },
        { id: 123, text: "外套（看天氣）", checked: false, category: "衣物" },
        { id: 124, text: "襪子 2–3 雙", checked: false, category: "衣物" },

        // === 盥洗用品 ===
        { id: 130, text: "牙刷牙膏（有些民宿不提供）", checked: false, category: "盥洗用品" },
        { id: 131, text: "簡單保養品 / 化妝品", checked: false, category: "盥洗用品" },
        { id: 132, text: "梳子 / 髮圈", checked: false, category: "盥洗用品" },

        // === 藥品 ===
        { id: 140, text: "暈車藥", checked: false, category: "藥品" },
        { id: 141, text: "腸胃藥", checked: false, category: "藥品" },

        // === 其他 ===
        { id: 150, text: "雨傘 / 雨衣", checked: false, category: "其他" },
        { id: 151, text: "水壺 / 隨行杯", checked: false, category: "其他" },
        { id: 152, text: "環保袋", checked: false, category: "其他" },
        { id: 153, text: "簡單零食", checked: false, category: "其他" },
    ],
};

// 5 天 4 夜・東南亞（泰國、越南、峇里島…）
const sea5d4nTemplate = {
    id: "sea_5d4n",
    name: "5天4夜・東南亞海島 / 都市",
    description: "偏熱帶、海島 + 都市的 5 天 4 夜旅行",
    items: [
        // === 證件 ===
        { id: 201, text: "護照（確認有效期限）", checked: false, category: "證件" },
        { id: 202, text: "簽證 / 入境文件（如需）", checked: false, category: "證件" },
        { id: 203, text: "機票 / 電子登機證", checked: false, category: "證件" },
        { id: 204, text: "旅平險 / 不便險資料", checked: false, category: "證件" },

        // === 電子產品 ===
        { id: 210, text: "手機 + 充電線", checked: false, category: "電子產品" },
        { id: 211, text: "行動電源（2 個更安心）", checked: false, category: "電子產品" },
        { id: 212, text: "萬國轉接頭", checked: false, category: "電子產品" },
        { id: 213, text: "相機 / GoPro", checked: false, category: "電子產品" },
        { id: 214, text: "防水手機套", checked: false, category: "電子產品" },

        // === 衣物 ===
        { id: 220, text: "透氣上衣 4–5 件", checked: false, category: "衣物" },
        { id: 221, text: "短褲 / 薄長褲 3–4 件", checked: false, category: "衣物" },
        { id: 222, text: "睡衣", checked: false, category: "衣物" },
        { id: 223, text: "內衣褲 5 套以上", checked: false, category: "衣物" },
        { id: 224, text: "薄外套 / 披肩（冷氣房用）", checked: false, category: "衣物" },
        { id: 225, text: "泳衣 / 比基尼", checked: false, category: "衣物" },
        { id: 226, text: "海灘拖 / 涼鞋", checked: false, category: "衣物" },
        { id: 227, text: "帽子 / 遮陽帽", checked: false, category: "衣物" },

        // === 盥洗用品 ===
        { id: 230, text: "牙刷牙膏", checked: false, category: "盥洗用品" },
        { id: 231, text: "洗面乳 / 卸妝用品", checked: false, category: "盥洗用品" },
        { id: 232, text: "輕量保養品 / 化妝品", checked: false, category: "盥洗用品" },
        { id: 233, text: "刮鬍刀 / 個人清潔用品", checked: false, category: "盥洗用品" },

        // === 藥品 ===
        { id: 240, text: "腸胃藥（當地飲食可能不習慣）", checked: false, category: "藥品" },
        { id: 241, text: "暈車 / 暈船藥", checked: false, category: "藥品" },
        { id: 242, text: "防蚊液 / 蟲咬藥", checked: false, category: "藥品" },
        { id: 243, text: "個人慢性病藥物", checked: false, category: "藥品" },

        // === 其他 ===
        { id: 250, text: "防曬乳（身體）", checked: false, category: "其他" },
        { id: 251, text: "防曬乳（臉部）", checked: false, category: "其他" },
        { id: 252, text: "太陽眼鏡", checked: false, category: "其他" },
        { id: 253, text: "折疊傘 / 輕便雨衣", checked: false, category: "其他" },
        { id: 254, text: "簡易醫療口罩", checked: false, category: "其他" },
        { id: 255, text: "小背包 / 腰包（出門用）", checked: false, category: "其他" },
    ],
};

// 寒冷地區・日本 / 韓國（秋冬）
const coldJapanKoreaTemplate = {
    id: "cold_jp_kr",
    name: "寒冷地區・日本 / 韓國",
    description: "適合秋冬去日本、韓國等較冷地區",
    items: [
        // === 證件 ===
        { id: 301, text: "護照（確認有效期限）", checked: false, category: "證件" },
        { id: 302, text: "簽證 / K-ETA / Visit Japan Web 等", checked: false, category: "證件" },
        { id: 303, text: "機票 / 電子登機證", checked: false, category: "證件" },
        { id: 304, text: "旅平險 / 不便險資料", checked: false, category: "證件" },

        // === 電子產品 ===
        { id: 310, text: "手機 + 充電線", checked: false, category: "電子產品" },
        { id: 311, text: "行動電源", checked: false, category: "電子產品" },
        { id: 312, text: "萬國轉接頭（日本 / 韓國用）", checked: false, category: "電子產品" },
        { id: 313, text: "相機（如需）", checked: false, category: "電子產品" },

        // === 衣物（保暖） ===
        { id: 320, text: "發熱衣 2–3 件", checked: false, category: "衣物" },
        { id: 321, text: "毛衣 / 厚長袖上衣 2–3 件", checked: false, category: "衣物" },
        { id: 322, text: "長褲 / 保暖褲 2–3 件", checked: false, category: "衣物" },
        { id: 323, text: "厚外套 / 羽絨外套", checked: false, category: "衣物" },
        { id: 324, text: "圍巾", checked: false, category: "衣物" },
        { id: 325, text: "手套", checked: false, category: "衣物" },
        { id: 326, text: "毛帽 / 耳罩", checked: false, category: "衣物" },
        { id: 327, text: "厚襪子 3–4 雙", checked: false, category: "衣物" },

        // === 盥洗與保養 ===
        { id: 330, text: "牙刷牙膏", checked: false, category: "盥洗用品" },
        { id: 331, text: "洗面乳", checked: false, category: "盥洗用品" },
        { id: 332, text: "高保濕乳液 / 乳霜", checked: false, category: "盥洗用品" },
        { id: 333, text: "護唇膏", checked: false, category: "盥洗用品" },
        { id: 334, text: "保濕噴霧 / 面膜（可選）", checked: false, category: "盥洗用品" },

        // === 藥品 ===
        { id: 340, text: "感冒藥 / 喉糖", checked: false, category: "藥品" },
        { id: 341, text: "腸胃藥", checked: false, category: "藥品" },
        { id: 342, text: "個人慢性病藥物", checked: false, category: "藥品" },
        { id: 343, text: "暖暖包", checked: false, category: "藥品" },

        // === 其他 ===
        { id: 350, text: "口罩", checked: false, category: "其他" },
        { id: 351, text: "雨傘 / 摺疊傘", checked: false, category: "其他" },
        { id: 352, text: "水壺 / 保溫瓶", checked: false, category: "其他" },
        { id: 353, text: "環保袋 / 購物袋", checked: false, category: "其他" },
        { id: 354, text: "小包 / 斜背包（逛街用）", checked: false, category: "其他" },
    ],
};

export const packingTemplates = [
    basicTemplate,
    taiwan3d2nTemplate,
    sea5d4nTemplate,
    coldJapanKoreaTemplate,
];

// 如果哪裡還有用到 defaultPackingItems，就讓它對應到「通用模板」
export const defaultPackingItems = basicTemplate.items;
