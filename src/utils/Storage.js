const Storage = {
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    get(key, defaultValue) {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
    },

    remove(key) {
        localStorage.removeItem(key);
    },

    clear() {
        localStorage.clear();
    }
};

export default Storage;
