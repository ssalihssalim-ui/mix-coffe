// ==================== loadVentes - VERSION AVEC FUSION CACHE + FIRESTORE SANS PERTE ====================
async function loadVentes() {
    var isAdmin = window.currentUserData && window.currentUserData.userData.role === 'admin';
    var vendeurCaissier = '';
    if (!isAdmin && window.currentUserData) {
        vendeurCaissier = window.currentUserData.userData.prenom + ' ' + window.currentUserData.userData.nom;
    }

    // ✅ 1. Charger TOUJOURS depuis CacheDB d'abord (source de vérité locale)
    try {
        const cached = await CacheDB.getAll('ventes');
        if (cached && cached.length) {
            var localVentes = cached.map(function(d) {
                var achat = 0, profit = 0;
                if (d.items) {
                    d.items.forEach(function(it) {
                        var pa = it.prixAchat || 0;
                        var pv = it.prixVente || 0;
                        var pp = it.prixPromo || 0;
                        var pvr = (pp > 0) ? pp : pv;
                        var q = it.quantite || 1;
                        achat += pa * q;
                        profit += (pvr - pa) * q;
                    });
                }
                d.achat = achat;
                d.profit = profit;
                return d;
            });

            if (!isAdmin) {
                localVentes = localVentes.filter(function(d) {
                    return d.vendeur === vendeurCaissier;
                });
            }

            window.allVentesData = localVentes;

            if (!window.sortOrders.ventes) window.sortOrders.ventes = {};
            if (!window.sortOrders.ventes.createdAt) {
                window.sortOrders.ventes.createdAt = 'desc';
            }

            window.currentPages.ventes = 1;
            applyVentesFilters();
            console.log('⚡ Ventes depuis CacheDB:', window.allVentesData.length);
        }
    } catch(e) {
        console.warn('⚠️ Erreur lecture CacheDB ventes:', e);
    }

    // ✅ 2. Charger depuis Firestore (si en ligne) ET FUSIONNER SANS ÉCRASER
    if (navigator.onLine) {
        try {
            const snapshot = await db.collection('ventes').orderBy('createdAt', 'desc').limit(2000).get();

            // ✅ Set des clés uniques déjà présentes (id + factureNum)
            var existingFirestoreIds = new Set();
            var existingFactureNums = new Set();
            var existingLocalIds = new Set();

            window.allVentesData.forEach(function(v) {
                if (v.id) existingLocalIds.add(v.id);
                if (v._firestoreId) existingFirestoreIds.add(v._firestoreId);
                if (v.factureNum) existingFactureNums.add(v.factureNum);
            });

            var freshVentes = [];
            snapshot.forEach(function(dc) {
                var d = dc.data();
                d.id = dc.id;

                var achat = 0, profit = 0;
                if (d.items) {
                    d.items.forEach(function(it) {
                        var pa = it.prixAchat || 0;
                        var pv = it.prixVente || 0;
                        var pp = it.prixPromo || 0;
                        var pvr = (pp > 0) ? pp : pv;
                        var q = it.quantite || 1;
                        achat += pa * q;
                        profit += (pvr - pa) * q;
                    });
                }
                d.achat = achat;
                d.profit = profit;
                d._synced = true;

                freshVentes.push(d);
            });

            if (!isAdmin) {
                freshVentes = freshVentes.filter(function(d) {
                    return d.vendeur === vendeurCaissier;
                });
            }

            // ✅ FUSION : on PART de allVentesData (qui contient les locales)
            // et on ajoute uniquement les ventes Firestore pas déjà présentes
            var finalVentes = window.allVentesData.slice();

            freshVentes.forEach(function(fv) {
                var alreadyExists = false;

                // Cas 1 : même ID Firestore (vente déjà synchronisée)
                if (existingFirestoreIds.has(fv.id)) {
                    alreadyExists = true;
                }

                // Cas 2 : même factureNum (détection doublon)
                if (!alreadyExists && fv.factureNum && existingFactureNums.has(fv.factureNum)) {
                    alreadyExists = true;

                    // ✅ Mettre à jour l'entrée locale avec les données fraîches
                    for (var i = 0; i < finalVentes.length; i++) {
                        var lv = finalVentes[i];
                        var matchByFacture = (lv.factureNum && fv.factureNum && lv.factureNum === fv.factureNum);
                        if (matchByFacture) {
                            finalVentes[i] = Object.assign({}, fv, {
                                id: lv.id,
                                _firestoreId: fv.id,
                                _synced: true,
                                _offline: false
                            });
                            break;
                        }
                    }
                }

                // Cas 3 : même ID direct
                if (!alreadyExists && existingLocalIds.has(fv.id)) {
                    alreadyExists = true;
                }

                if (!alreadyExists) {
                    finalVentes.push(fv);
                    // L'ajouter au cache
                    try {
                        CacheDB.set('ventes', fv.id, fv);
                    } catch(e) { }
                }
            });

            // Sauvegarder les nouvelles ventes Firestore dans le cache
            for (var j = 0; j < freshVentes.length; j++) {
                try {
                    await CacheDB.set('ventes', freshVentes[j].id, freshVentes[j]);
                } catch(e) { }
            }

            if (typeof CacheDB !== 'undefined' && CacheDB.saveCollection) {
                try {
                    CacheDB.saveCollection('ventes');
                } catch(e) { }
            }

            window.allVentesData = finalVentes;

            if (!window.sortOrders.ventes) window.sortOrders.ventes = {};
            if (!window.sortOrders.ventes.createdAt) {
                window.sortOrders.ventes.createdAt = 'desc';
            }

            console.log('🔥 Ventes Firestore:', freshVentes.length,
                        '| Total après fusion:', finalVentes.length);

        } catch(e) {
            console.error('❌ Erreur chargement Firestore:', e);
            // ⚠️ EN CAS D'ERREUR : on GARDE les ventes locales (déjà dans allVentesData)
            // Rien à faire ici, elles sont déjà chargées à l'étape 1
        }
    } else {
        console.log('📴 Hors ligne - Affichage uniquement depuis CacheDB');
    }

    // ✅ 3. Réinitialiser la pagination et afficher
    window.currentPages.ventes = 1;
    applyVentesFilters();
}
