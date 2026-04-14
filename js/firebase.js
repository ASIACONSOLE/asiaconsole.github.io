// =====================================================
//  FIREBASE INTEGRATION — AsiaConsole
//  Provides real-time sync across all devices via
//  Cloud Firestore. Works alongside localStorage as
//  an instant local cache layer.
// =====================================================

// ---- FIREBASE CONFIG ----
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBhpI-7c08eB6VN_LhS5jNIrSQ_NDvFbYA",
    authDomain: "asia-console.firebaseapp.com",
    projectId: "asia-console",
    storageBucket: "asia-console.firebasestorage.app",
    messagingSenderId: "1063457883595",
    appId: "1:1063457883595:web:c8b5946208098f19a9e24e",
    measurementId: "G-50B31ZJV6C"
};

// Global instance variable
var FirebaseDB;

// ---- FIREBASE REALTIME DB WRAPPER ----
FirebaseDB = {
    db: null,
    _listeners: {},
    _ready: false,
    _lastStatus: 'connecting',
    _lastErrorMessage: '',
    _readyCallbacks: [],

    // Initialize Firebase & Firestore
    init() {
        // Load Firebase compat SDKs sequentially to prevent race conditions
        const scripts = [
            'https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js',
            'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js'
        ];

        let index = 0;
        const loadNext = () => {
            if (index < scripts.length) {
                const s = document.createElement('script');
                s.src = scripts[index];
                s.onload = () => {
                    index++;
                    loadNext();
                };
                s.onerror = (err) => {
                    console.warn('[Firebase] Could not load SDK from', scripts[index]);
                    this._triggerConnectionEvent('error', `SDK yüklenemedi: ${scripts[index]}`);
                };
                document.head.appendChild(s);
            } else {
                // All scripts loaded
                this._initialize();
            }
        };

        loadNext();
    },

    _initialize() {
        try {
            // Check if already initialized to avoid "Duplicate App" error
            if (!firebase.apps.length) {
                firebase.initializeApp(FIREBASE_CONFIG);
            }
            this.db = firebase.firestore();
            this._ready = true;
            this._triggerConnectionEvent('connected');
            console.log('[Firebase] Connected to Firestore ✓');
            // Run pending callbacks
            this._readyCallbacks.forEach(cb => cb());
            this._readyCallbacks = [];
        } catch (e) {
            console.warn('[Firebase] Init failed:', e);
            this._triggerConnectionEvent('error', `Başlatma hatası: ${e.message}`);
        }
    },

    // Run callback when Firebase is ready
    onReady(cb) {
        if (this._ready) cb();
        else this._readyCallbacks.push(cb);
    },

    // Write a full document to a collection
    async set(collection, docId, data) {
        return new Promise((resolve) => {
            this.onReady(async () => {
                try {
                    await this.db.collection(collection).doc(docId).set(data);
                    this._triggerConnectionEvent('connected');
                    resolve(true);
                } catch (e) {
                    console.warn('[Firebase] Write error:', e);
                    this._triggerConnectionEvent('error', `Yazma hatası: ${e.message}`);
                    resolve(false);
                }
            });
        });
    },

    // Get a document from a collection
    async get(collection, docId) {
        return new Promise((resolve) => {
            this.onReady(async () => {
                try {
                    const doc = await this.db.collection(collection).doc(docId).get();
                    this._triggerConnectionEvent('connected');
                    resolve(doc.exists ? doc.data() : null);
                } catch (e) {
                    console.warn('[Firebase] Read error:', e);
                    this._triggerConnectionEvent('error', `Okuma hatası: ${e.message}`);
                    resolve(null);
                }
            });
        });
    },

    // Get all documents from a collection
    async getAll(collection) {
        return new Promise((resolve) => {
            this.onReady(async () => {
                try {
                    const snap = await this.db.collection(collection).get();
                    this._triggerConnectionEvent('connected');
                    resolve(snap.docs.map(d => ({ _id: d.id, ...d.data() })));
                } catch (e) {
                    console.warn('[Firebase] GetAll error:', e);
                    this._triggerConnectionEvent('error', `Toplu okuma hatası: ${e.message}`);
                    resolve([]);
                }
            });
        });
    },

    // Real-time listener on a document — calls callback instantly on change
    listen(collection, docId, callback) {
        if (!this._ready || !this.db) {
            // Will retry when ready
            this.onReady(() => this.listen(collection, docId, callback));
            return;
        }
        const key = `${collection}/${docId}`;
        if (this._listeners[key]) this._listeners[key](); // Unsubscribe old
        this._listeners[key] = this.db
            .collection(collection)
            .doc(docId)
            .onSnapshot(doc => {
                if (doc.exists) callback(doc.data());
            }, err => {
                console.warn('[Firebase] Listener error:', err);
                this._triggerConnectionEvent('error', `Dinleme hatası: ${err.message}`);
            });
    },

    // Listen to all documents in a collection
    listenAll(collection, callback) {
        if (!this._ready || !this.db) {
            this.onReady(() => this.listenAll(collection, callback));
            return;
        }
        const key = `collection/${collection}`;
        if (this._listeners[key]) this._listeners[key]();
        this._listeners[key] = this.db
            .collection(collection)
            .onSnapshot(snap => {
                const docs = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
                callback(docs);
            }, err => console.warn('[Firebase] Collection listener error:', err));
    },

    // Delete a document
    async delete(collection, docId) {
        return new Promise((resolve) => {
            this.onReady(async () => {
                try {
                    await this.db.collection(collection).doc(docId).delete();
                    this._triggerConnectionEvent('connected');
                    resolve(true);
                } catch (e) {
                    console.warn('[Firebase] Delete error:', e);
                    this._triggerConnectionEvent('error', `Silme hatası: ${e.message}`);
                    resolve(false);
                }
            });
        });
    },

    // Merge (partial update) instead of full overwrite
    async update(collection, docId, data) {
        return new Promise((resolve) => {
            this.onReady(async () => {
                try {
                    await this.db.collection(collection).doc(docId).set(data, { merge: true });
                    this._triggerConnectionEvent('connected');
                    resolve(true);
                } catch (e) {
                    console.warn('[Firebase] Operation error:', e);
                    this._triggerConnectionEvent('error', e.message);
                    resolve(false);
                }
            });
        });
    },

    // Event trigger for UI
    _triggerConnectionEvent(status, message = '') {
        this._lastStatus = status;
        this._lastErrorMessage = message;
        if (status === 'error') console.error('[Firebase Error]', message);
        const ev = new CustomEvent('firebaseStatus', { detail: { status, message } });
        document.dispatchEvent(ev);
    }
};

// Auto-initialize on load
FirebaseDB.init();
