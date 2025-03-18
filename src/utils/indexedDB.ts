export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("DuckStore", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("ducks")) {
        db.createObjectStore("ducks");
      }
    };
  });
};

export const storeDuckData = async (data: any): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["ducks"], "readwrite");
    const store = transaction.objectStore("ducks");
    const request = store.put(data, "currentDucks");

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getDuckData = async (): Promise<any> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["ducks"], "readonly");
    const store = transaction.objectStore("ducks");
    const request = store.get("currentDucks");

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const clearDuckData = async (): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["ducks"], "readwrite");
    const store = transaction.objectStore("ducks");
    const request = store.delete("currentDucks");

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};
