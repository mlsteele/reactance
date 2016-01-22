module.exports = store_reset

function store_reset(version) {
    var stored = store.get('STORE_DB_VERSION')
    if (stored === version) {
	return
    } else {
	store.clear()
	store.set('STORE_DB_VERSION', version)
    }
}

window.store_reset = store_reset;
