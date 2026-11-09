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
  // Accendo o spengo il pulsante "Cerca offerte" (la funzione è più sotto)
  aggiornaPulsante();
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


// ===== 3. La ricerca con Claude =====
const risultati = document.getElementById("risultati");

// Le istruzioni per Claude: sono i criteri decisi al punto 3.
const ISTRUZIONI = `Cerca sul web i 3 migliori portatili Copilot+ PC acquistabili ADESSO in Italia, con il miglior rapporto qualità/prezzo.

Requisiti obbligatori:
- portatile (non fisso), certificato Copilot+ PC (NPU da almeno 40 TOPS: Snapdragon X, Intel Core Ultra 200V/300, AMD Ryzen AI)
- almeno 32 GB di RAM e almeno 1 TB di SSD
- prezzo fino a 3.000 €, IVA inclusa
- nuovo (non ricondizionato), tastiera italiana
- venduto da un negozio online italiano (Amazon.it, MediaWorld, Unieuro, Euronics, siti ufficiali delle marche) con spedizione in Italia

Uso previsto: lavoro generale, programmazione, foto e video.

Come lavorare (hai al massimo 6 ricerche web e 6 pagine da aprire, usale bene):
1. Con web_search, scrivendo le ricerche in italiano, trova le schede prodotto. Un buon punto
   di partenza sono trovaprezzi.it e idealo.it: una pagina mostra i prezzi di molti negozi.
2. Con web_fetch apri le schede più promettenti e controlla lì prezzo, RAM, SSD,
   tastiera e disponibilità. Puoi aprire SOLO indirizzi copiati esattamente dai risultati
   di ricerca o dalle pagine già aperte: non inventare né modificare gli indirizzi.
   Se una pagina non si apre, passa alla successiva.
3. Il link di ogni offerta deve essere la scheda prodotto che hai aperto.
4. Preferisci negozi che vendono direttamente rispetto ai venditori di marketplace.

Restituisci sempre 3 offerte. Se non ne trovi 3 che rispettano TUTTI i requisiti, completa la lista
con le offerte più vicine e scrivi nel campo "compromesso" quale requisito non rispettano
(per esempio "16 GB di RAM invece di 32"). Per le offerte che rispettano tutto, lascia "compromesso" vuoto.

Alla fine rispondi SOLO con un oggetto JSON, senza altro testo, in questo formato:
{"nota": "una frase in italiano sulla situazione del mercato o sulle difficoltà incontrate",
 "offerte": [{"nome": "...", "prezzo": "1.799 €", "negozio": "...", "link": "https://...", "motivo": "una o due frasi in italiano", "compromesso": ""}]}`;

// I siti dove Claude può cercare: negozi italiani, comparatori di prezzi
// italiani (una pagina mostra i prezzi di molti negozi) e siti delle marche.
const SITI_PERMESSI = [
  "trovaprezzi.it", "idealo.it",
  "amazon.it", "mediaworld.it", "unieuro.it", "euronics.it", "eprice.it",
  "lenovo.com", "hp.com", "dell.com", "microsoft.com", "asus.com", "acer.com", "samsung.com",
];

// Prezzi di Sonnet 5.5 in dollari, per stimare il costo di ogni ricerca
const COSTO_INPUT = 2 / 1000000;     // $ per token letto
const COSTO_OUTPUT = 10 / 1000000;   // $ per token scritto
const COSTO_RICERCA_WEB = 0.01;      // $ per ogni ricerca web

// Una singola chiamata all'API di Claude.
// fetch() è come requests.post() in Python.
async function chiamaClaude(chiave, messaggi) {
  const risposta = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": chiave,
      "anthropic-version": "2026-10-21",
      // Serve per chiamare l'API direttamente da una pagina web.
      // "dangerous" perché la chiave sta nel browser: va bene qui,
      // perché la chiave è solo tua e solo sul tuo iPhone.
      "anthropic-dangerous-direct-browser-access": "true",
      // Se Claude rifiuta la richiesta per errore, il server riprova da solo con un altro modello
      "anthropic-beta": "server-side-fallback-2026-07-01",
    },
    // JSON.stringify trasforma l'oggetto in testo JSON (come json.dumps in Python)
    body: JSON.stringify({
      model: "claude-sonnet-5-5",
      max_tokens: 16000,
      output_config: { effort: "medium" },
      fallbacks: "default",
      tools: [
        // Ricerca web: al massimo 6 ricerche (1 centesimo l'una),
        // fatta "dall'Italia" e solo sui siti di questa lista
        {
          type: "web_search_20260209",
          name: "web_search",
          max_uses: 6,
          user_location: { type: "approximate", country: "IT", city: "Roma", timezone: "Europe/Rome" },
          allowed_domains: SITI_PERMESSI,
        },
        // Lettura delle pagine trovate: al massimo 6 pagine, e di ogni pagina
        // solo i primi 6000 token (circa 4.500 parole), per tenere basso il costo
        { type: "web_fetch_20260209", name: "web_fetch", max_uses: 6, max_content_tokens: 6000 },
      ],
      messages: messaggi,
    }),
  });

  const dati = await risposta.json();

  if (!risposta.ok) {
    // Traduco gli errori più comuni in messaggi comprensibili
    const testo = (dati.error && dati.error.message) || "";
    if (risposta.status === 401) throw new Error("La chiave API non è valida. Cancellala e inseriscila di nuovo.");
    if (testo.toLowerCase().includes("credit")) throw new Error("Credito finito o limite di spesa raggiunto. Controlla la console Anthropic.");
    if (risposta.status === 429) throw new Error("Troppe richieste in poco tempo. Riprova tra un minuto.");
    if (risposta.status >= 500) throw new Error("Il servizio di Claude è momentaneamente sovraccarico. Riprova tra poco.");
    throw new Error("Errore " + risposta.status + ": " + testo);
  }
  return dati;
}

// Fa la ricerca completa e restituisce { offerte, costo }
async function cercaOfferte(chiave) {
  const messaggi = [{ role: "user", content: ISTRUZIONI }];
  let costo = 0;
  let dati;
  // Per capire come è andata: ricerche riuscite, pagine aperte e quali errori
  const ricerche = { riuscite: 0, pagine: 0, errori: {} };

  // Le ricerche web lunghe possono "mettersi in pausa" (pause_turn):
  // in quel caso rimando la conversazione e Claude continua da dove era rimasto.
  for (let giro = 0; giro < 6; giro++) {
    dati = await chiamaClaude(chiave, messaggi);

    const uso = dati.usage || {};
    const ricercheWeb = (uso.server_tool_use && uso.server_tool_use.web_search_requests) || 0;
    costo += (uso.input_tokens || 0) * COSTO_INPUT
           + (uso.output_tokens || 0) * COSTO_OUTPUT
           + ricercheWeb * COSTO_RICERCA_WEB;

    // Ogni risultato di ricerca web è una lista di pagine se è andato bene;
    // ogni pagina aperta è un oggetto "web_fetch_result" se è andata bene.
    // Se qualcosa va storto, al loro posto c'è un oggetto con "error_code".
    dati.content.forEach(function (blocco) {
      const contenuto = blocco.content;
      let riuscito;
      if (blocco.type === "web_search_tool_result") {
        riuscito = Array.isArray(contenuto);
        if (riuscito) ricerche.riuscite++;
      } else if (blocco.type === "web_fetch_tool_result") {
        riuscito = contenuto && contenuto.type === "web_fetch_result";
        if (riuscito) ricerche.pagine++;
      } else {
        return;   // non è un risultato di ricerca o di lettura: lo salto
      }
      if (!riuscito) {
        const codice = (contenuto && contenuto.error_code) || "sconosciuto";
        ricerche.errori[codice] = (ricerche.errori[codice] || 0) + 1;
      }
    });

    if (dati.stop_reason !== "pause_turn") break;
    messaggi.push({ role: "assistant", content: dati.content });
  }

  if (dati.stop_reason === "refusal") {
    throw new Error("Claude non ha potuto completare questa ricerca. Riprova.");
  }

  // Unisco tutti i pezzi di testo della risposta
  const testo = dati.content
    .filter((blocco) => blocco.type === "text")
    .map((blocco) => blocco.text)
    .join("");

  const esito = estraiOfferte(testo);
  esito.costo = costo;
  esito.ricerche = ricerche;
  return esito;   // { nota, offerte, costo, ricerche }
}

// Tira fuori il JSON dalla risposta, anche se Claude ci ha messo testo intorno.
// Restituisce { nota, offerte }.
function estraiOfferte(testo) {
  const inizio = testo.indexOf("{");
  const fine = testo.lastIndexOf("}");
  if (inizio === -1 || fine === -1) {
    throw new Error("Risposta di Claude non leggibile. Riprova.");
  }
  try {
    const oggetto = JSON.parse(testo.slice(inizio, fine + 1));   // come json.loads
    return { nota: oggetto.nota || "", offerte: oggetto.offerte || [] };
  } catch (errore) {
    throw new Error("Risposta di Claude non leggibile. Riprova.");
  }
}

// Mostra le offerte come elenco semplice (nel pezzo 4 diventeranno schede)
function mostraOfferte(nota, offerte) {
  risultati.textContent = "";   // svuoto i risultati precedenti

  // La nota di Claude sulla situazione (es. "pochi modelli con 32 GB sotto i 3.000 €")
  if (nota) {
    const paragrafoNota = document.createElement("p");
    paragrafoNota.className = "nota centrato";
    paragrafoNota.textContent = "💬 " + nota;
    risultati.appendChild(paragrafoNota);
  }

  if (offerte.length === 0) {
    const vuoto = document.createElement("p");
    vuoto.className = "nota centrato";
    vuoto.textContent = "Nessuna offerta trovata con questi criteri.";
    risultati.appendChild(vuoto);
    return;
  }

  // Creo gli elementi uno per uno con textContent: così il testo che arriva
  // da internet viene sempre mostrato come testo e mai eseguito come codice.
  offerte.forEach(function (offerta, i) {
    const riquadro = document.createElement("div");
    riquadro.className = "riquadro";

    const titolo = document.createElement("h2");
    titolo.textContent = (i + 1) + ". " + (offerta.nome || "");
    riquadro.appendChild(titolo);

    const dettagli = document.createElement("p");
    dettagli.textContent = (offerta.prezzo || "") + " – " + (offerta.negozio || "");
    riquadro.appendChild(dettagli);

    const motivo = document.createElement("p");
    motivo.className = "nota";
    motivo.textContent = offerta.motivo || "";
    riquadro.appendChild(motivo);

    // Se l'offerta non rispetta tutti i requisiti, lo dico chiaramente
    if (offerta.compromesso) {
      const compromesso = document.createElement("p");
      compromesso.className = "compromesso";
      compromesso.textContent = "⚠️ Compromesso: " + offerta.compromesso;
      riquadro.appendChild(compromesso);
    }

    // Mostro il link solo se è un vero indirizzo web sicuro
    if (typeof offerta.link === "string" && offerta.link.startsWith("https://")) {
      const link = document.createElement("a");
      link.href = offerta.link;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Vai al negozio →";
      riquadro.appendChild(link);
    }

    risultati.appendChild(riquadro);
  });
}

// Il pulsante "Cerca offerte"
pulsanteCerca.addEventListener("click", async function () {
  const chiave = leggiChiave();
  if (!chiave) {
    messaggio.textContent = "Prima salva la chiave API.";
    return;
  }

  pulsanteCerca.disabled = true;
  risultati.textContent = "";
  messaggio.textContent = "🔎 Claude sta cercando… può volerci un minuto o due.";

  try {
    const esito = await cercaOfferte(chiave);
    mostraOfferte(esito.nota, esito.offerte);
    // Riepilogo: costo e come sono andate le ricerche web
    let riepilogo = "Costo di questa ricerca: circa " + esito.costo.toFixed(2) + " $"
                  + " · Ricerche web: " + esito.ricerche.riuscite
                  + " · Pagine aperte: " + esito.ricerche.pagine;
    // Object.entries è come dict.items() in Python
    Object.entries(esito.ricerche.errori).forEach(function ([codice, quante]) {
      riepilogo += " · Errore " + codice + ": " + quante;
    });
    messaggio.textContent = riepilogo;
  } catch (errore) {
    messaggio.textContent = "⚠️ " + errore.message;
  } finally {
    // "finally" viene eseguito sempre, come in Python
    pulsanteCerca.disabled = false;
  }
});

// Il pulsante si accende solo se c'è una chiave salvata
function aggiornaPulsante() {
  pulsanteCerca.disabled = !leggiChiave();
  if (!leggiChiave()) {
    messaggio.textContent = "Salva la chiave API per poter cercare.";
  } else {
    messaggio.textContent = "Versione " + versioneAttuale + ". Pronto a cercare.";
  }
}
