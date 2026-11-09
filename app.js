// ===== Offerte PC AI – il programma =====
// Questo file viene caricato alla fine di index.html,
// quindi tutti gli elementi della pagina esistono già.

// Prendo gli elementi della pagina che mi servono.
// "const" è come una variabile Python che non verrà più riassegnata.
const pulsanteCerca = document.getElementById("cerca");
const messaggio = document.getElementById("messaggio");

// Per ora mostro solo un messaggio, per verificare che app.js venga caricato.
// Nel pezzo 3 qui metteremo la ricerca vera.
messaggio.textContent = "App pronta. La ricerca arriverà nei prossimi passi.";
