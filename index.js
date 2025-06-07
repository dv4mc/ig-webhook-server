const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const VERIFY_TOKEN = 'tajnyklic123';

app.use(cors());
app.use(bodyParser.json());

let roastPending = false; // 🔥 stav, jestli má Unity spustit roast

// ✅ Webhook ověření (Meta callback ověření)
app.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✔️ Webhook ověřen');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Ověření selhalo');
    res.sendStatus(403);
  }
});

// ✅ Webhook – reaguje na Instagram zprávy i HTML požadavek
app.post('/', (req, res) => {
  console.log('📥 IG webhook přišel:', JSON.stringify(req.body, null, 2));

  const body = req.body;

  // 💬 ZPRÁVA z Instagramu (přes Graph API webhook)
  if (body.object === 'instagram') {
    try {
      const changes = body.entry?.[0]?.changes;
      if (changes && changes.length > 0) {
        changes.forEach(change => {
          const msg = change.value?.message?.text?.toLowerCase();
          if (msg && msg.includes('roast me')) {
            roastPending = true;
            console.log('🔥 Zpráva z IG: "roast me" => roastPending = true');
          }
        });
      } else {
        console.log('⚠️ IG webhook bez změn');
      }
    } catch (err) {
      console.error('❌ Chyba při zpracování IG zprávy:', err);
    }
    return res.sendStatus(200);
  }

  // 🌐 Požadavek z webu (např. HTML tlačítko)
  const { source, trigger } = body;
  if (source === 'frontend' && trigger === 'roast-me') {
    roastPending = true;
    console.log('🔥 Požadavek z webu => roastPending = true');
    return res.status(200).send('OK');
  }

  res.sendStatus(200);
});

// ✅ Endpoint pro Unity – zjistí, jestli má spustit roast
app.get('/status', (req, res) => {
  res.json({ triggerRoast: roastPending });
  roastPending = false; // resetne po přečtení
});

// 🔥 Spuštění serveru
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server běží na portu ${PORT}`));
