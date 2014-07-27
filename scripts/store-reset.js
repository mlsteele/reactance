module.exports = store_reset

function store_reset(version) {
    var stored = store.get('STORE_DB_VERSION')
    console.log(`store last version ${stored}`)
    if (stored === version) {
        return
    } else {
        console.log(`store new version ${version}`)
        store.clear()
        store.set('STORE_DB_VERSION', version)
    }
}
