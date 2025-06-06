const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const VERIFY_TOKEN = 'tajnyklic123';

// Middlewares
app.use(cors()); // 🟢 dovolí požadavky z jiných domén
app.use(bodyParser.json());

// Webhook verifikace (GET)
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

// Webhook přijímá data (POST)
app.post('/', (req, res) => {
  const { source, trigger } = req.body;

  if (source === 'frontend' && trigger === 'roast-me') {
    console.log('🔥 Požadavek na roast z webu!');
    return res.status(200).send('Roast accepted');
  }

  console.log('📩 Webhook payload:', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

// Spuštění serveru
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server běží na portu ${PORT}`));
