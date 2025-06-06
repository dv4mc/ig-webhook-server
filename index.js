// index.js
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
// Port, na kterém bude server naslouchat (Render ho přepíše proměnnou PORT)
const port = process.env.PORT || 3000;

// VERIFY_TOKEN (nasetujeme ho později jako env variable v Renderu)
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 1) Endpoint pro GET ověření webhooku (Facebook/Instagram posílá GET request pro validaci)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // Pokud se Facebook/Instagram ptá na ověření a token sedí, vrátíme challenge zpět:
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified");
    return res.status(200).send(challenge);
  } else {
    console.error("❌ Webhook verification failed. Neplatný token.");
    return res.sendStatus(403);
  }
});

// 2) Endpoint pro příjem událostí (POST z Instagramu)
app.post("/webhook", (req, res) => {
  const body = req.body;

  // Instagram webhooky přicházejí s object = "instagram"
  if (body.object === "instagram") {
    body.entry.forEach((entry) => {
      entry.changes.forEach((change) => {
        if (change.field === "messages") {
          // Tady dostaneš payload, jakmile přijde nová zpráva
          console.log("📨 Příchozí Instagram zpráva:", JSON.stringify(change.value, null, 2));
          // Zde můžeš zprávu dále zpracovat (uložit do DB, odeslat e-mail, atd.)
        }
      });
    });
    // Každý POST musíme potvrdit HTTP 200, aby Facebook/Instagram věděl, že jsme to dostali
    return res.status(200).send("EVENT_RECEIVED");
  } else {
    // Pokud je object něco jiného než "instagram", odpovíme 404
    return res.sendStatus(404);
  }
});

// Spuštění serveru
app.listen(port, () => {
  console.log(`Server běží na portu ${port}`);
});
