// src/utils/storage.js

const storage = {
    async get(key) {
        try {
            if (typeof window !== "undefined" &&
                window.storage &&
                typeof window.storage.get === "function") {
                return await window.storage.get(key);
            }

            // fallback to localStorage
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
            if (typeof window !== "undefined" &&
                window.storage &&
                typeof window.storage.set === "function") {
                return await window.storage.set(key, value);
            }

            // fallback to localStorage
            window.localStorage.setItem(key, value);
        } catch (err) {
            console.error("storage.set 錯誤:", err);
        }
    }
};

export default storage;
