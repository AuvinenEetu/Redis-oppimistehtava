require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const redis = require('redis');
const { performance } = require('perf_hooks');

const app = express();
app.use(express.json());
app.use(morgan('dev'));
app.use(cors({ exposedHeaders: ['X-Query-Time-ms', 'X-Data-Source'] }));

// Allow browsers to expose resource timing details for cross-origin requests
app.use((req, res, next) => {
  res.setHeader('Timing-Allow-Origin', '*');
  next();
});

const PORT = process.env.PORT || 3000;

// Simple mongoose model
const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    value: { type: Number, default: 0 },
  },
  { timestamps: true },
);
const Item = mongoose.model('Item', itemSchema);

// Bet schema mapped explicitly to collection named 'bets'
const betSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    kayttaja_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    kayttajan_nimi: { type: String },
    tapahtuma_id: { type: mongoose.Schema.Types.ObjectId },
    tapahtuman_nimi: { type: String },
    valinta: { type: String },
    panos: { type: Number },
    kerroin: { type: Number },
    tila: { type: String },
    vedon_pvm: { type: Date },
  },
  { collection: 'bets', timestamps: true },
);
const Bet = mongoose.model('Bet', betSchema);

// Event schema -> collection 'events' (match sample fields)
const eventSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    nimi: { type: String },
    kuvaus: { type: String },
    kategoria: { type: String },
    status: { type: String },
    luoja: { type: mongoose.Schema.Types.ObjectId },
    kertoimet: { type: mongoose.Schema.Types.Mixed },
    tulos: { type: mongoose.Schema.Types.Mixed },
    tapahtuma_pvm: { type: Date },
  },
  { collection: 'events', timestamps: true },
);
const Event = mongoose.model('Event', eventSchema);

// User schema -> collection 'users' (match sample fields)
const userSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    nimi: { type: mongoose.Schema.Types.Mixed },
    kayttajatunnus: { type: String },
    sahkoposti: { type: String },
    salasana: { type: String },
  },
  { collection: 'users', timestamps: true },
);
const User = mongoose.model('User', userSchema);

// Routes
app.get('/', (req, res) =>
  res.send({ ok: true, message: 'Mongo Express API' }),
);

// Init sample data endpoint
app.post('/init-sample', async (req, res) => {
  try {
    // Check if collections already have data
    const uCount = await User.countDocuments();
    const eCount = await Event.countDocuments();
    const bCount = await Bet.countDocuments();
    if (uCount || eCount || bCount) {
      return res.status(400).json({
        error: 'Collections not empty; init aborted',
        counts: { users: uCount, events: eCount, bets: bCount },
      });
    }

    // Prepare sample docs using provided IDs
    const user1Id = new mongoose.Types.ObjectId('69ca46ae83788ea4e78816b3');
    const user2Id = new mongoose.Types.ObjectId('69ca46ae83788ea4e78816b4');
    const user3Id = new mongoose.Types.ObjectId('69ca46ae83788ea4e78816b5');

    const event1Id = new mongoose.Types.ObjectId('69ca586983788ea4e78816f7');

    const users = [
      {
        _id: user1Id,
        nimi: { etunimi: 'Matti', sukunimi: 'Meikäläinen' },
        kayttajatunnus: 'matti_meika',
        sahkoposti: 'matti@gmail.fi',
        salasana: 'matti123',
      },
      {
        _id: user2Id,
        nimi: 'Maija Meikäläinen',
        kayttajatunnus: 'maija_meika',
        sahkoposti: 'maija@gmail.fi',
        salasana: 'maija123',
      },
      {
        _id: user3Id,
        nimi: 'John Doe',
        kayttajatunnus: 'john_doe',
        sahkoposti: 'john@example.com',
        salasana: 'john123',
      },
    ];

    const events = [
      {
        _id: event1Id,
        nimi: 'LoL: G2 Esports vs T1',
        kuvaus: 'Voittaako T1 worldsit taas?',
        kategoria: 'esports',
        status: 'avoin',
        luoja: user2Id,
        kertoimet: { 'G2 Esports': 1.95, T1: 2.1 },
        tulos: null,
        tapahtuma_pvm: new Date('2026-06-15T18:00:00.000Z'),
      },
    ];

    const bets = [
      {
        _id: new mongoose.Types.ObjectId('69ca5a7f83788ea4e7881704'),
        kayttaja_id: user2Id,
        kayttajan_nimi: 'Maija Meikäläinen',
        tapahtuma_id: event1Id,
        tapahtuman_nimi: 'LoL: G2 Esports vs T1',
        valinta: 'G2 Esports',
        panos: 15,
        kerroin: 1.95,
        tila: 'avoin',
        vedon_pvm: new Date('2026-05-10T14:00:00.000Z'),
      },
    ];

    await User.insertMany(users);
    await Event.insertMany(events);
    await Bet.insertMany(bets);

    res.json({
      ok: true,
      inserted: {
        users: users.length,
        events: events.length,
        bets: bets.length,
      },
    });
  } catch (err) {
    console.error('Error initializing sample data:', err);
    res.status(500).json({ error: err.message });
  }
});

// CRUD for items
app.get('/items', async (req, res) => {
  try {
    const items = await Item.find().limit(100);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/items', async (req, res) => {
  try {
    const it = new Item(req.body);
    const saved = await it.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/items/:id', async (req, res) => {
  try {
    const it = await Item.findById(req.params.id);
    if (!it) return res.status(404).json({ error: 'Not found' });
    res.json(it);
  } catch (err) {
    res.status(400).json({ error: 'Invalid id' });
  }
});

app.put('/items/:id', async (req, res) => {
  try {
    const updated = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/items/:id', async (req, res) => {
  try {
    const del = await Item.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Invalid id' });
  }
});

// New routes for bets collection
// Initialize Redis client if REDIS_URL provided
let redisClient = null;
(async () => {
  const redisUrlEnv = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = process.env.REDIS_PORT || '6379';
  const redisDb = parseInt(
    process.env.REDIS_DB || process.env.REDIS_DATABASE || '0',
    10,
  );
  const redisUrl = redisUrlEnv || `redis://${redisHost}:${redisPort}`;
  // normalize common mistakes: user may provide http://localhost:6379 — convert to redis://
  let normalizedRedisUrl = redisUrl;
  if (normalizedRedisUrl.startsWith('http://'))
    normalizedRedisUrl = normalizedRedisUrl.replace(/^http:/, 'redis:');
  if (normalizedRedisUrl.startsWith('https://'))
    normalizedRedisUrl = normalizedRedisUrl.replace(/^https:/, 'rediss:');
  // use normalized URL
  const finalRedisUrl = normalizedRedisUrl;
  try {
    // create client with optional database selection
    redisClient = redis.createClient({ url: finalRedisUrl });
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
    // select DB if client supports select (node-redis v4 uses options; to be safe, call select)
    if (typeof redisClient.select === 'function') {
      try {
        await redisClient.select(redisDb);
      } catch (e) {
        console.warn('Redis select failed', e.message);
      }
    }
    console.log(`Connected to Redis at ${finalRedisUrl} db=${redisDb}`);
  } catch (err) {
    console.error('Could not connect to Redis:', err.message);
    redisClient = null;
  }
})();

// helper to get/set cache
// Add replacer to properly serialize ObjectId and Date when storing to Redis
function _cacheReplacer(key, value) {
  try {
    // detect mongodb ObjectId (bson) and convert to hex string
    if (value && typeof value === 'object') {
      if (
        typeof value._bsontype === 'string' &&
        value._bsontype === 'ObjectID' &&
        typeof value.toHexString === 'function'
      ) {
        return value.toHexString();
      }
      // fallback: some ObjectId instances expose constructor name
      if (
        value.constructor &&
        value.constructor.name === 'ObjectID' &&
        typeof value.toHexString === 'function'
      ) {
        return value.toHexString();
      }
    }
    if (value instanceof Date) return value.toISOString();
  } catch (e) {
    // ignore and fall through to default
  }
  return value;
}

// Track whether RedisJSON module is available (null = unknown)
let _redisJsonAvailable = null;

async function _checkRedisJson() {
  if (_redisJsonAvailable !== null) return _redisJsonAvailable;
  if (!redisClient) return (_redisJsonAvailable = false);
  try {
    // try a harmless JSON.GET on a non-existing key; server will return null or error if module missing
    // Using sendCommand to call module command directly
    await redisClient.sendCommand(['JSON.GET', '__REDIS_JSON_PING__']);
    _redisJsonAvailable = true;
  } catch (e) {
    _redisJsonAvailable = false;
  }
  return _redisJsonAvailable;
}

async function cacheGet(key) {
  if (!redisClient) return null;
  try {
    const hasJson = await _checkRedisJson();
    if (hasJson) {
      try {
        const raw = await redisClient.sendCommand(['JSON.GET', key]);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        // if JSON.GET fails for this key, fall back to GET
      }
    }
    const v = await redisClient.get(key);
    return v ? JSON.parse(v) : null;
  } catch (e) {
    console.error('Redis get error', e);
    return null;
  }
}

async function cacheSet(key, value, ttlSec = 10) {
  if (!redisClient) return;
  try {
    const hasJson = await _checkRedisJson();
    const payload = JSON.stringify(value, _cacheReplacer);
    if (hasJson) {
      try {
        // store as RedisJSON and set expiry
        await redisClient.sendCommand(['JSON.SET', key, '.', payload]);
        if (ttlSec > 0) await redisClient.expire(key, String(ttlSec));
        return;
      } catch (e) {
        // fall through to string SET
      }
    }
    await redisClient.set(key, payload, { EX: ttlSec });
  } catch (e) {
    console.error('Redis set error', e);
  }
}

app.get('/bets', async (req, res) => {
  try {
    const t0 = performance.now();
    const cacheKey = 'bets:all';
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.set('X-Query-Time-ms', '0');
      res.set('X-Data-Source', 'redis');
      return res.json(cached);
    }
    // use lean() so Mongoose returns plain JS objects (better for caching)
    const bets = await Bet.find().limit(200).sort({ vedon_pvm: -1 }).lean();
    const t1 = performance.now();
    res.set('X-Query-Time-ms', String((t1 - t0).toFixed(3)));
    res.set('X-Data-Source', 'mongo');
    cacheSet(cacheKey, bets);
    res.json(bets);
  } catch (err) {
    console.error('Error in GET /bets:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/bets/:id', async (req, res) => {
  try {
    const b = await Bet.findById(req.params.id);
    if (!b) return res.status(404).json({ error: 'Not found' });
    res.json(b);
  } catch (err) {
    console.error(`Error in GET /bets/${req.params.id}:`, err);
    res.status(400).json({ error: 'Invalid id' });
  }
});

// Routes for events
app.get('/events', async (req, res) => {
  try {
    const t0 = performance.now();
    const cacheKey = 'events:all';
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.set('X-Query-Time-ms', '0');
      res.set('X-Data-Source', 'redis');
      return res.json(cached);
    }
    // return plain objects
    const events = await Event.find().limit(200).sort({ paiva: 1 }).lean();
    const t1 = performance.now();
    res.set('X-Query-Time-ms', String((t1 - t0).toFixed(3)));
    res.set('X-Data-Source', 'mongo');
    cacheSet(cacheKey, events);
    res.json(events);
  } catch (err) {
    console.error('Error in GET /events:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/events/:id', async (req, res) => {
  try {
    const e = await Event.findById(req.params.id);
    if (!e) return res.status(404).json({ error: 'Not found' });
    res.json(e);
  } catch (err) {
    console.error(`Error in GET /events/${req.params.id}:`, err);
    res.status(400).json({ error: 'Invalid id' });
  }
});

// Routes for users
app.get('/users', async (req, res) => {
  try {
    const t0 = performance.now();
    const cacheKey = 'users:all';
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.set('X-Query-Time-ms', '0');
      res.set('X-Data-Source', 'redis');
      return res.json(cached);
    }
    // return plain objects
    const users = await User.find().limit(200).sort({ nimi: 1 }).lean();
    const t1 = performance.now();
    res.set('X-Query-Time-ms', String((t1 - t0).toFixed(3)));
    res.set('X-Data-Source', 'mongo');
    cacheSet(cacheKey, users);
    res.json(users);
  } catch (err) {
    console.error('Error in GET /users:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ error: 'Not found' });
    res.json(u);
  } catch (err) {
    console.error(`Error in GET /users/${req.params.id}:`, err);
    res.status(400).json({ error: 'Invalid id' });
  }
});

// Top events endpoint: choose mode=count (by number of bets) or mode=stake (by total panos)
app.get('/top-events', async (req, res) => {
  try {
    const mode = req.query.mode === 'stake' ? 'stake' : 'count';
    const cacheKey = `top-events:${mode}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.set('X-Query-Time-ms', '0');
      res.set('X-Data-Source', 'redis');
      return res.json({ mode, results: cached });
    }

    const t0 = performance.now();
    const pipeline = [
      {
        $group: {
          _id: {
            tapahtuma_id: '$tapahtuma_id',
            tapahtuman_nimi: '$tapahtuman_nimi',
          },
          count: { $sum: 1 },
          totalPanos: { $sum: { $ifNull: ['$panos', 0] } },
        },
      },
      { $sort: mode === 'stake' ? { totalPanos: -1 } : { count: -1 } },
      { $limit: 5 },
      {
        $project: {
          tapahtuma_id: '$_id.tapahtuma_id',
          tapahtuman_nimi: '$_id.tapahtuman_nimi',
          count: 1,
          totalPanos: 1,
          _id: 0,
        },
      },
      {
        $lookup: {
          from: 'events',
          localField: 'tapahtuma_id',
          foreignField: '_id',
          as: 'event',
        },
      },
      { $unwind: { path: '$event', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          tapahtuma_id: 1,
          tapahtuman_nimi: 1,
          count: 1,
          totalPanos: 1,
          event: 1,
        },
      },
    ];

    const results = await Bet.collection.aggregate(pipeline).toArray();
    const t1 = performance.now();
    res.set('X-Query-Time-ms', String((t1 - t0).toFixed(3)));
    res.set('X-Data-Source', 'mongo');
    cacheSet(cacheKey, results, 10);
    res.json({ mode, results });
  } catch (err) {
    console.error('Error in GET /top-events:', err);
    res.status(500).json({ error: err.message });
  }
});

// Connect to Mongo and start
const mongoUri =
  process.env.MONGO_URI ||
  'mongodb://root:password@localhost:27017/vedonlyontikanta?authSource=admin';
mongoose
  .connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
