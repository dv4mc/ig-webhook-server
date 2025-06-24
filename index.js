const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const VERIFY_TOKEN = 'tajnyklic123';

app.use(cors());
app.use(bodyParser.json());

let roastPending = {
  triggerRoast: false,
  skipInstagram: false
};


// ✅ Webhook ověření z Meta při registraci URL
app.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('👉 Webhook OVĚŘENÍ požadavek:', { mode, token, challenge });

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✔️ Webhook ověřen správně');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Ověření selhalo – token nesedí nebo špatný mód');
    res.sendStatus(403);
  }
});

// ✅ Webhook POST – Instagram změny nebo frontend trigger
app.post('/', (req, res) => {
  console.log('📥 Webhook POST přijat:', JSON.stringify(req.body, null, 2));

  const body = req.body;

  // 📩 IG zpráva (z Graph API)
  if (body.object === 'instagram') {
    try {
      const changes = body.entry?.[0]?.changes;
      if (changes && changes.length > 0) {
        changes.forEach(change => {
          const msg = change.value?.message?.text?.toLowerCase();
          if (msg && msg.includes('roast me')) {
            roastPending = true;
            console.log('🔥 IG zpráva detekována: roast me => roastPending = true');
          } else {
            console.log('ℹ️ IG zpráva nebyla "roast me"');
          }
        });
      } else {
        console.log('⚠️ IG webhook přišel, ale neobsahuje žádné změny');
      }
    } catch (err) {
      console.error('❌ Chyba při zpracování IG webhooku:', err);
    }
    return res.sendStatus(200);
  }

  // 🖱️ HTML trigger z webu
  const { source, trigger } = body;
  if (source === 'frontend' && trigger === 'roast-me') {
    roastPending.triggerRoast = true;
    roastPending.skipInstagram = body.skipInstagram === true;

    console.log('🔥 HTML trigger z webu => triggerRoast = true');
    console.log('🛑 skipInstagram =', roastPending.skipInstagram);

    return res.status(200).send('OK');
  }


  // ❌ Neznámý payload
  console.log('❓ Neznámý payload, žádná akce');
  res.sendStatus(200);
});

// ✅ Unity dotaz: má se spustit roast?
app.get('/status', (req, res) => {
  console.log('📡 Dotaz na /status, odpověď:', roastPending);

  res.json(roastPending);

  // Reset po odeslání
  roastPending.triggerRoast = false;
  roastPending.skipInstagram = false;
});


// ✅ Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server běží na portu ${PORT}`);
});