// if ('serviceWorker' in navigator) {
//     navigator.serviceWorker.register('sw.js', {scope: './'}).then(function() {
//         console.log('Service worker registered')
//         install()
//     }).catch(function() {
//         console.log('Service worker registration failed')
//     })
// }
// else {
//     console.log('Service worker not supported')
// }


// Here comes the install event!
// This only happens once, when the browser sees this
// version of the ServiceWorker for the first time.
self.addEventListener('install', function(event) {
    // We pass a promise to event.waitUntil to signal how 
    // long install takes, and if it failed
    event.waitUntil(
        // We open a cache…
        caches.open('simple-sw-v1').then(function(cache) {
            // And add resources to it
            console.log('caching! (I guess...)')
            return cache.addAll([
                './',
                'style.css',
                'main.js'
            ]);
        })
    );
});

// The fetch event happens for the page request with the
// ServiceWorker's scope, and any request made within that
// page
self.addEventListener('fetch', function(event) {
    // Calling event.respondWith means we're in charge
    // of providing the response. We pass in a promise
    // that resolves with a response object
    event.respondWith(
        // First we look for something in the caches that
        // matches the request
        caches.match(event.request).then(function(response) {
        // If we get something, we return it, otherwise
        // it's null, and we'll pass the request to
        // fetch, which will use the network.
        return response || fetch(event.request);
        })
    );
});
