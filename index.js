const express = require("express");
const bodyParser = require("body-parser");
const app = express();

// VERIFY_TOKEN musí sedět s tím, co jste nastavili v Render → Environment → VERIFY_TOKEN
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "tajnyklic123";

app.use(bodyParser.json());

// 1) Healthcheck (GET) pro ověření webhooku
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified");
    return res.status(200).send(challenge);
  }

  console.error("❌ Webhook verification failed. Expected token:", VERIFY_TOKEN, "but got:", token);
  return res.sendStatus(403);
});

// 2) Příjem POST notifikací z Facebooku/Instagramu
app.post("/webhook", (req, res) => {
  // Debug-print: vždy zalogujeme, co přesně přišlo
  console.log("📬 ANY POST /webhook – raw body:", JSON.stringify(req.body));

  const body = req.body;

  // Uživatelé hlásí, že sem chodí různé typy payloadů. Proto ověřme, že
  // – body.object === "instagram"
  // – body.entry existuje a je to pole
  if (body.object === "instagram" && Array.isArray(body.entry)) {
    // Teprve tady bezpečně voláme forEach
    body.entry.forEach(entry => {
      // entry.changes má být pole; ošetříme i ten případ
      if (Array.isArray(entry.changes)) {
        entry.changes.forEach(change => {
          if (change.field === "messages" && change.value) {
            console.log("📨 New IG Message:", JSON.stringify(change.value, null, 2));
            // Zde můžete zpracovat change.value (uložit do DB, odeslat e-mail, apod.)
          }
        });
      } else {
        console.warn("⚠️ entry.changes není pole:", entry.changes);
      }
    });
    // Když dojde zpracování, vraťme Facebooku/Instatu 200 OK
    return res.status(200).send("EVENT_RECEIVED");
  }

  // Pokud to není payload od Instagramu (jiný objekt), jen to ignorujeme a vracíme 200 OK
  console.log("ℹ️ Ignored non-Instagram or malformed payload");
  return res.sendStatus(200);
});

// Spuštění serveru
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
