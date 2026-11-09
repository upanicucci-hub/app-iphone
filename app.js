// ===== Offerte PC AI – il programma =====
// Questo file viene caricato alla fine di index.html,
// quindi tutti gli elementi della pagina esistono già.

// Prendo gli elementi della pagina che mi servono.
// "const" è come una variabile Python che non verrà più riassegnata.
const pulsanteCerca = document.getElementById("cerca");
const messaggio = document.getElementById("messaggio");

const boxDaInserire = document.getElementById("chiave-da-inserire");
const boxSalvata = document.getElementById("chiave-salvata");
const campoChiave = document.getElementById("campo-chiave");
const chiaveFinale = document.getElementById("chiave-finale");
const erroreChiave = document.getElementById("errore-chiave");

// Il nome con cui la chiave viene salvata nella memoria dell'iPhone
const NOME_CHIAVE = "chiave-api-anthropic";


// ===== 1. Controllo della nuova versione =====
// La versione di questa pagina è scritta in index.html (<meta name="versione">).
const versioneAttuale = document.querySelector('meta[name="versione"]').content;

// "async" vuol dire che la funzione può aspettare una risposta da internet
// senza bloccare la pagina (come asyncio in Python).
async function controllaNuovaVersione() {
  try {
    // "?t=" + l'ora attuale rende l'indirizzo sempre diverso,
    // così l'iPhone non può usare una copia vecchia di versione.json
    const risposta = await fetch("versione.json?t=" + Date.now(), { cache: "no-store" });
    const dati = await risposta.json();   // come json.loads() in Python

    // La seconda condizione evita di ricaricare all'infinito
    // se per qualche motivo la pagina nuova non è ancora arrivata.
    const giaRicaricata = location.search === "?v=" + dati.versione;

    if (dati.versione !== versioneAttuale && !giaRicaricata) {
      // C'è una versione nuova: ricarico la pagina con un indirizzo nuovo (?v=...),
      // così l'iPhone è costretto a scaricare anche index.html di nuovo.
      location.replace(location.pathname + "?v=" + dati.versione);
    }
  } catch (errore) {
    // Senza internet il controllo non riesce: pazienza, si usa la versione che c'è.
  }
}

controllaNuovaVersione();

// Ricontrollo anche quando l'app torna in primo piano
// (per esempio riaprendola dalla Home senza averla chiusa del tutto).
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible") {
    controllaNuovaVersione();
  }
});


// ===== 2. La chiave API =====
// localStorage è un piccolo "dizionario" salvato nel browser dell'iPhone:
// resta lì anche chiudendo l'app, e non va mai su GitHub.
// Uso try/catch perché in alcuni casi (es. navigazione privata) non è disponibile.
function leggiChiave() {
  try {
    return localStorage.getItem(NOME_CHIAVE);
  } catch (errore) {
    return null;
  }
}

function salvaChiave(chiave) {
  try {
    localStorage.setItem(NOME_CHIAVE, chiave);
    return true;
  } catch (errore) {
    return false;
  }
}

function cancellaChiave() {
  try {
    localStorage.removeItem(NOME_CHIAVE);
  } catch (errore) {
    // niente da fare
  }
}

// Mostra il riquadro giusto: "inserisci la chiave" oppure "chiave salvata"
function aggiornaRiquadroChiave() {
  const chiave = leggiChiave();
  erroreChiave.textContent = "";

  if (chiave) {
    boxDaInserire.hidden = true;
    boxSalvata.hidden = false;
    // Mostro solo gli ultimi 4 caratteri, mai la chiave intera
    chiaveFinale.textContent = "…" + chiave.slice(-4);
  } else {
    boxDaInserire.hidden = false;
    boxSalvata.hidden = true;
    campoChiave.value = "";
  }
}

document.getElementById("salva-chiave").addEventListener("click", function () {
  // .trim() toglie spazi e a capo copiati per sbaglio (come .strip() in Python)
  const chiave = campoChiave.value.trim();

  if (!chiave.startsWith("sk-ant-")) {
    erroreChiave.textContent = "La chiave deve iniziare con sk-ant-. Controlla di averla copiata tutta.";
    return;
  }
  if (!salvaChiave(chiave)) {
    erroreChiave.textContent = "Non riesco a salvare la chiave su questo dispositivo.";
    return;
  }
  aggiornaRiquadroChiave();
});

document.getElementById("cancella-chiave").addEventListener("click", function () {
  // confirm() mostra una finestra con OK / Annulla
  if (confirm("Vuoi davvero cancellare la chiave da questo iPhone?")) {
    cancellaChiave();
    aggiornaRiquadroChiave();
  }
});

aggiornaRiquadroChiave();

// Per ora mostro solo un messaggio. Nel pezzo 3 qui metteremo la ricerca vera.
messaggio.textContent = "Versione " + versioneAttuale + ". La ricerca arriverà nel prossimo pezzo.";
