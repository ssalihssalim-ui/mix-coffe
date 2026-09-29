// ==================== FIREBASE CONFIGURATION - E-SOLUTION POS ====================
// 🔥 PROJET : e-solution-pos (nom d'affichage — ID technique Firebase inchangé)

const firebaseConfig = {
    apiKey: "AIzaSyCTjPYtuLYieTgadCbtrqIhjLEoC64FwBA",
    authDomain: "mix-coffe.firebaseapp.com",
    projectId: "mix-coffe",
    storageBucket: "mix-coffe.firebasestorage.app",
    messagingSenderId: "838187722029",
    appId: "1:838187722029:web:4f3a10dd7bb02fdfdc1fa4"
};

// Initialisation Firebase (version compat)
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialisé avec le projet:', firebaseConfig.projectId);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Activer la persistance offline
db.enablePersistence()
    .then(() => console.log('📱 Mode hors ligne activé'))
    .catch(err => console.warn('⚠️ Persistance désactivée:', err));

console.log('🏪 E-SOLUTION POS - Firebase OK');
console.log('✓ Projet:', firebaseConfig.projectId);
console.log('✓ Auth Domain:', firebaseConfig.authDomain);
