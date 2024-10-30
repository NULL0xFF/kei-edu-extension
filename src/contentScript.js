const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');

// Automatically import all scripts in the 'scripts' directory
function importAll(r) {
  r.keys().forEach(r);
}

importAll(require.context('./scripts/', true, /\.js$/));
