const DB_NAME = "claw-crawls";
const RUN_STORE_PREFIX = "run_";

const getRunStoreName = (runId) => `${RUN_STORE_PREFIX}${runId}`;

const openDb = (version, onUpgrade) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, version);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (typeof onUpgrade === "function") {
        onUpgrade(db);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getRunStoreNames = (db) => {
  return Array.from(db.objectStoreNames).filter((name) =>
    name.startsWith(RUN_STORE_PREFIX)
  );
};

const sortRunStoresByRunIdDesc = (names) => {
  return names
    .map((name) => {
      const suffix = name.slice(RUN_STORE_PREFIX.length);
      const runId = Number(suffix);
      return { name, runId: Number.isFinite(runId) ? runId : 0 };
    })
    .sort((a, b) => b.runId - a.runId || a.name.localeCompare(b.name))
    .map((item) => item.name);
};

const ensureRunStore = async (runId) => {
  if (runId == null) return;
  const storeName = getRunStoreName(runId);
  let db = await openDb();
  if (db.objectStoreNames.contains(storeName)) {
    db.close();
    return;
  }
  const nextVersion = db.version + 1;
  db.close();

  db = await openDb(nextVersion, (upgradeDb) => {
    if (!upgradeDb.objectStoreNames.contains(storeName)) {
      upgradeDb.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
    }

    const runStores = sortRunStoresByRunIdDesc(getRunStoreNames(upgradeDb));
    const toDelete = runStores.slice(3);
    for (const name of toDelete) {
      upgradeDb.deleteObjectStore(name);
    }
  });
  db.close();
};

export const addRecords = async (records) => {
  if (!Array.isArray(records) || records.length === 0) return;
  const runId = records[0]?.runId;
  if (runId == null) return;
  await ensureRunStore(runId);
  const storeName = getRunStoreName(runId);
  const db = await openDb();
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(storeName)) {
      db.close();
      resolve();
      return;
    }
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    for (const record of records) {
      store.add(record);
    }
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
};

export const getRecordsByRun = async (runId) => {
  if (runId == null) return [];
  const storeName = getRunStoreName(runId);
  const db = await openDb();
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(storeName)) {
      db.close();
      resolve([]);
      return;
    }
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => {
      db.close();
      resolve(request.result || []);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
};

export const deleteRunRecords = async (runId) => {
  if (runId == null) return;
  const storeName = getRunStoreName(runId);
  const db = await openDb();
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(storeName)) {
      db.close();
      resolve();
      return;
    }
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.clear();
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
};

export const deleteAllRunStores = async () => {
  let db = await openDb();
  const runStores = getRunStoreNames(db);
  if (runStores.length === 0) {
    db.close();
    return;
  }
  const nextVersion = db.version + 1;
  db.close();

  db = await openDb(nextVersion, (upgradeDb) => {
    const names = getRunStoreNames(upgradeDb);
    for (const name of names) {
      upgradeDb.deleteObjectStore(name);
    }
  });
  db.close();
};
