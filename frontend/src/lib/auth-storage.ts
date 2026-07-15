const isAndroidApp = () =>
  navigator.userAgent.includes("WorkSphereAndroid");

const storage = isAndroidApp()
  ? localStorage
  : sessionStorage;

export const authStorage = {
  setItem(key: string, value: string) {
    storage.setItem(key, value);
  },

  getItem(key: string) {
    return storage.getItem(key);
  },

  removeItem(key: string) {
    storage.removeItem(key);
  },

  clear() {
    storage.clear();
  },
};