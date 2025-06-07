const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const VERIFY_TOKEN = 'tajnyklic123';

app.use(cors());
app.use(bodyParser.json());

let roastPending = false; // 🔥 stav, jestli má Unity spustit roast

// Webhook ověření (např. pro Meta)
app.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✔️ Webhook ověřen');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook – reaguje na Instagram zprávy i HTML požadavek
app.post('/', (req, res) => {
  const body = req.body;

  // 💬 ZPRÁVA z Instagramu (přes Graph API webhook)
  if (body.object === 'instagram') {
    try {
      const messagingEvents = body.entry?.[0]?.messaging;
      if (messagingEvents) {
        messagingEvents.forEach(event => {
          const msg = event.message?.text?.toLowerCase();
          if (msg && msg.includes('roast me')) {
            roastPending = true;
            console.log('🔥 Zpráva z IG: "roast me" => roastPending = true');
          }
        });
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

// Unity se ptá: „mám spustit roast?“
app.get('/status', (req, res) => {
  res.json({ triggerRoast: roastPending });
  roastPending = false; // reset
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server běží na portu ${PORT}`));
