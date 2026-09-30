// ==================== CAISSIER.JS - E-SOLUTION ====================

(function() {
    let attempts = 0;
    const maxAttempts = 50;
    const interval = 300;
    let intervalId = null;

    function redirectToValidRole() {
        if (!window.currentUserData) {
            if (++attempts >= maxAttempts) {
                console.error('Impossible de détecter l\'utilisateur connecté');
                if (intervalId) clearInterval(intervalId);
                if (typeof showAuthPage === 'function') showAuthPage();
            }
            return false;
        }
        if (intervalId) clearInterval(intervalId);

        const role = window.currentUserData.userData.role;
        if (role !== 'caissier') {
            console.warn(`Rôle ${role} détecté, redirection...`);
            if (role === 'admin' && typeof showDashboard === 'function') {
                showDashboard();
            } else if (role === 'client' && typeof showClientPage === 'function') {
                showClientPage();
            } else if (typeof showAuthPage === 'function') {
                showAuthPage();
            }
            return false;
        }

        console.log('🚀 Interface caissier E-SOLUTION chargée');
        return true;
    }

    intervalId = setInterval(function() {
        redirectToValidRole();
    }, interval);
})();

// ==================== MENU CAISSIER ====================
// ✅ Ordre identique à buildMenu() dans script.js pour le rôle caissier
var CAISSIER_MENU_PAGES = ['pos', 'commandes', 'ventes', 'credits', 'depenses'];

var CAISSIER_TITLES = {
    'pos': 'POS',
    'commandes': 'Commandes en ligne',
    'ventes': 'Ventes',
    'credits': 'Crédits',
    'depenses': 'Dépenses'
};

var CAISSIER_ICONS = {
    'pos': 'fa-cash-register',
    'commandes': 'fa-shopping-basket',
    'ventes': 'fa-shopping-cart',
    'credits': 'fa-credit-card',
    'depenses': 'fa-money-bill-wave'
};

// ✅ Fonction dédiée pour naviguer + marquer l'item actif
function navigateToCaissier(page) {
    console.log('📍 Navigation caissier vers:', page);

    // 1️⃣ Retirer .active de tous les items
    var items = document.querySelectorAll('#navMenu .nav-item');
    items.forEach(function(item) { item.classList.remove('active'); });

    // 2️⃣ Ajouter .active au bon item selon l'index
    var index = CAISSIER_MENU_PAGES.indexOf(page);
    if (index >= 0 && items[index]) {
        items[index].classList.add('active');
    }

    // 3️⃣ Mettre à jour titre + icône
    var titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = CAISSIER_TITLES[page] || page;

    var iconEl = document.querySelector('.header-title i');
    if (iconEl && CAISSIER_ICONS[page]) iconEl.className = 'fas ' + CAISSIER_ICONS[page];

    // 4️⃣ Charger le contenu
    var content = document.getElementById('dynamicContent');
    if (!content) return;

    content.innerHTML = '<div style="text-align:center;padding:20px;"><i class="fas fa-spinner fa-spin" style="font-size:1.5rem;color:#00C853;"></i></div>';

    // Cas particulier : Dépenses
    if (page === 'depenses') {
        if (typeof window.loadDepensesPage === 'function') {
            window.loadDepensesPage(content);
        } else if (typeof loadDepensesPage === 'function') {
            loadDepensesPage(content);
        } else {
            content.innerHTML = '<div class="content-card"><p style="text-align:center;padding:40px;color:#94a3b8;">Dépenses non disponibles</p></div>';
        }
        if (typeof closeSidebar === 'function') closeSidebar();
        return;
    }

    // Pages standard du caissier
    var pageFunctions = {
        'pos': 'loadPosPage',
        'commandes': 'loadCommandesPage',
        'ventes': 'loadVentesPage',
        'credits': 'loadCreditsPage'
    };
    var fnName = pageFunctions[page];

    if (fnName && typeof window[fnName] === 'function') {
        try {
            window[fnName](content);
        } catch (e) {
            console.error('Erreur chargement page caissier:', e);
            content.innerHTML = '<div class="content-card" style="text-align:center;padding:40px;"><h3>Erreur</h3><p>' + e.message + '</p></div>';
        }
    } else {
        content.innerHTML = '<div class="content-card"><h3>' + (CAISSIER_TITLES[page] || 'Page') + '</h3><p style="text-align:center;padding:40px;">En développement</p></div>';
    }

    if (typeof closeSidebar === 'function') closeSidebar();
}

// ✅ Intercepter les clics sur les items du menu caissier
(function() {
    function attachCaissierMenuHandlers() {
        var isCaissier = window.currentUserData
            && window.currentUserData.userData
            && window.currentUserData.userData.role === 'caissier';
        if (!isCaissier) return false;

        var items = document.querySelectorAll('#navMenu .nav-item');
        if (!items.length) return false;

        items.forEach(function(item, idx) {
            var page = CAISSIER_MENU_PAGES[idx];
            if (!page) return;
            // On remplace le onclick existant par notre fonction dédiée
            item.onclick = function() { navigateToCaissier(page); };
        });

        // Marquer POS comme actif par défaut
        var firstItem = document.querySelector('#navMenu .nav-item');
        if (firstItem) firstItem.classList.add('active');

        console.log('✅ Menu caissier : gestionnaires attachés (' + items.length + ' items)');
        return true;
    }

    // Attacher dès que le menu est prêt
    var checkInterval = setInterval(function() {
        if (attachCaissierMenuHandlers()) {
            clearInterval(checkInterval);
        }
    }, 500);

    // Sécurité : arrêter après 30 secondes
    setTimeout(function() { clearInterval(checkInterval); }, 30000);
})();

// ==================== PAGES DE BASE CAISSIER (fallback) ====================
function loadCaissierDashboard() {
    if (typeof loadDashboardPage === 'function') {
        loadDashboardPage(document.getElementById('dynamicContent'));
    } else {
        console.error('loadDashboardPage non définie');
    }
}

function loadCaissierPOS() {
    if (typeof loadPosPage === 'function') {
        loadPosPage(document.getElementById('dynamicContent'));
    } else {
        console.error('loadPosPage non définie');
    }
}

function loadCaissierCommandes() {
    if (typeof loadCommandesPage === 'function') {
        loadCommandesPage(document.getElementById('dynamicContent'));
    } else {
        console.error('loadCommandesPage non définie');
    }
}

function loadCaissierVentes() {
    if (typeof loadVentesPage === 'function') {
        loadVentesPage(document.getElementById('dynamicContent'));
    } else {
        console.error('loadVentesPage non définie');
    }
}

function loadCaissierCredits() {
    if (typeof loadCreditsPage === 'function') {
        loadCreditsPage(document.getElementById('dynamicContent'));
    } else {
        console.error('loadCreditsPage non définie');
    }
}

// ==================== EXPORTS ====================
window.navigateToCaissier = navigateToCaissier;
window.CAISSIER_MENU_PAGES = CAISSIER_MENU_PAGES;
window.loadCaissierDashboard = loadCaissierDashboard;
window.loadCaissierPOS = loadCaissierPOS;
window.loadCaissierCommandes = loadCaissierCommandes;
window.loadCaissierVentes = loadCaissierVentes;
window.loadCaissierCredits = loadCaissierCredits;

console.log('🚀 Caissier JS prêt (menu actif corrigé + Dépenses identiques à l\'admin)');
