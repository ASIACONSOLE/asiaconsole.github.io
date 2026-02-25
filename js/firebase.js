// =====================================================
//  FIREBASE INTEGRATION — AsiaConsole
//  Provides real-time sync across all devices via
//  Cloud Firestore. Works alongside localStorage as
//  an instant local cache layer.
// =====================================================

// ---- FIREBASE CONFIG ----
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAY2-JMHxNgBvM8jHmadiCRHi--eDTSW_Q",
    authDomain: "asia-console.firebaseapp.com",
    projectId: "asia-console",
    storageBucket: "asia-console.firebasestorage.app",
    messagingSenderId: "1063457883595",
    appId: "1:1063457883595:web:c8b5946208098f19a9e24e",
    measurementId: "G-50B31ZJV6C"
};

// ---- FIREBASE REALTIME DB WRAPPER ----
const FirebaseDB = {
    db: null,
    _listeners: {},
    _ready: false,
    _readyCallbacks: [],

    // Initialize Firebase & Firestore
    init() {
        // Load Firebase compat SDKs dynamically
        const scripts = [
            'https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js',
            'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js'
        ];

        let loaded = 0;
        const onLoad = () => {
            loaded++;
            if (loaded === scripts.length) {
                try {
                    firebase.initializeApp(FIREBASE_CONFIG);
                    this.db = firebase.firestore();
                    this._ready = true;
                    console.log('[Firebase] Connected to Firestore ✓');
                    // Run pending callbacks
                    this._readyCallbacks.forEach(cb => cb());
                    this._readyCallbacks = [];
                } catch (e) {
                    console.warn('[Firebase] Init failed:', e);
                }
            }
        };

        scripts.forEach(src => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = onLoad;
            s.onerror = () => console.warn('[Firebase] Could not load SDK from', src);
            document.head.appendChild(s);
        });
    },

    // Run callback when Firebase is ready
    onReady(cb) {
        if (this._ready) cb();
        else this._readyCallbacks.push(cb);
    },

    // Write a full document to a collection
    async set(collection, docId, data) {
        if (!this._ready || !this.db) return false;
        try {
            await this.db.collection(collection).doc(docId).set(data);
            return true;
        } catch (e) {
            console.warn('[Firebase] Write error:', e);
            return false;
        }
    },

    // Get a document from a collection
    async get(collection, docId) {
        if (!this._ready || !this.db) return null;
        try {
            const doc = await this.db.collection(collection).doc(docId).get();
            return doc.exists ? doc.data() : null;
        } catch (e) {
            console.warn('[Firebase] Read error:', e);
            return null;
        }
    },

    // Get all documents from a collection
    async getAll(collection) {
        if (!this._ready || !this.db) return [];
        try {
            const snap = await this.db.collection(collection).get();
            return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
        } catch (e) {
            console.warn('[Firebase] GetAll error:', e);
            return [];
        }
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
            }, err => console.warn('[Firebase] Listener error:', err));
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
        if (!this._ready || !this.db) return false;
        try {
            await this.db.collection(collection).doc(docId).delete();
            return true;
        } catch (e) {
            console.warn('[Firebase] Delete error:', e);
            return false;
        }
    },

    // Merge (partial update) instead of full overwrite
    async update(collection, docId, data) {
        if (!this._ready || !this.db) return false;
        try {
            await this.db.collection(collection).doc(docId).set(data, { merge: true });
            return true;
        } catch (e) {
            console.warn('[Firebase] Update error:', e);
            return false;
        }
    }
};

// Auto-initialize on load
FirebaseDB.init();
