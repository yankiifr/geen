const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const kpiSchema = new mongoose.Schema({
  name: String,
  value: Number,
  date: { type: Date, default: Date.now }
});

const KPI = mongoose.model('KPI', kpiSchema);

app.get('/kpis', async (req, res) => {
  try {
    const kpis = await KPI.find();
    res.json(kpis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/kpis', async (req, res) => {
  const kpi = new KPI({
    name: req.body.name,
    value: req.body.value
  });
  try {
    const newKPI = await kpi.save();
    res.status(201).json(newKPI);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/weather/:location', async (req, res) => {
  const location = req.params.location;
  try {
    const response = await axios.get('https://api.tomorrow.io/v4/timelines', {
      params: {
        location: location,
        fields: ['temperature', 'precipitation'],
        timesteps: ['1h'],
        units: 'metric',
        apikey: process.env.TOMORROW_API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/huggingface/completion', async (req, res) => {
  const { prompt } = req.body;
  try {
    const response = await axios.post('https://api-inference.huggingface.co/models/mistralai/Codestral-22B-v0.1', {
      inputs: prompt,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/codestral/completion', async (req, res) => {
  const { prompt } = req.body;
  try {
    const response = await axios.post('https://codestral.mistral.ai/v1/fim/completions', {
      prompt: prompt,
      max_tokens: 150,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.CODESTRAL_API_KEY}`
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/codestral/chat', async (req, res) => {
  const { messages } = req.body;
  try {
    const response = await axios.post('https://codestral.mistral.ai/v1/chat/completions', {
      messages: messages,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.CODESTRAL_API_KEY}`
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
