require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

const PORT = process.env.PORT || 3000;

// Simple mongoose model
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: Number, default: 0 }
}, { timestamps: true });
const Item = mongoose.model('Item', itemSchema);

// Routes
app.get('/', (req, res) => res.send({ ok: true, message: 'Mongo Express API' }));

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
    const updated = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
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

// Connect to Mongo and start
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/testdb';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
