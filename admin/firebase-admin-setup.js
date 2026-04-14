/**
 * AsiaConsole — Firebase Admin SDK Setup & Modernization
 * 
 * Bu script, kullanımdan kaldırılan "Veritabanı Sırları" (Database Secrets) yerine
 * modern Firebase Admin SDK kullanımını gösterir.
 * 
 * KULLANIM:
 * 1. Firebase Console -> Project Settings -> Service Accounts sekmesine gidin.
 * 2. "Generate New Private Key" butonuna basın ve JSON dosyasını indirin.
 * 3. Dosyayı bu dizine 'service-account.json' olarak kaydedin.
 * 4. 'npm install' komutunu çalıştırın.
 * 5. 'node admin/firebase-admin-setup.js' ile çalıştırın.
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// Servis hesabı dosya yolu
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');

try {
    const serviceAccount = require(SERVICE_ACCOUNT_PATH);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // Realtime DB kullanıyorsanız: databaseURL: "https://PROJECT_ID.firebaseio.com"
    });

    const db = admin.firestore();

    console.log('✅ Firebase Admin SDK başarıyla başlatıldı!');
    console.log('🚀 Artık Firestore verilerine tam yetki ile erişebilirsiniz.');

    // Örnek: Site ayarlarını oku
    async function checkConnection() {
        try {
            const settingsDoc = await db.collection('site_data').doc('settings').get();
            if (settingsDoc.exists) {
                console.log('📊 Mevcut site ayarları doğrulandı.');
            } else {
                console.log('ℹ️ Site ayarları dokümanı henüz oluşturulmamış.');
            }
        } catch (err) {
            console.error('❌ Veritabanı erişim hatası:', err.message);
        }
    }

    checkConnection();

} catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
        console.error('❌ HATA: service-account.json dosyası bulunamadı!');
        console.log('Lütfen Firebase Console\'dan indirdiğiniz servis hesabı anahtarını bu isimle "admin/" klasörüne kaydedin.');
    } else {
        console.error('❌ Başlatma hatası:', err.message);
    }
}
