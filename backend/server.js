const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// --- Register Route ---
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  const password_hash = hashPassword(password);

  const db = require('./db');
  const sql = 'INSERT INTO users (username, password_hash) VALUES (?, ?)';
  db.query(sql, [username, password_hash], (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Username already exists' });
      }
      return res.status(500).json({ message: 'Server error' });
    }
    res.json({ message: 'User registered successfully' });
  });
});

// --- Login Route ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const password_hash = hashPassword(password);

  const db = require('./db');
  const sql = 'SELECT * FROM users WHERE username = ? AND password_hash = ?';
  db.query(sql, [username, password_hash], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', username });
  });
});

// --- Admin Change User Password ---
app.put('/api/users/admin-change-password', (req, res) => {
  const { username, newPassword } = req.body;
  const password_hash = hashPassword(newPassword);

  if (username === 'admin') {
    return res.status(400).json({ message: 'Admin password cannot be changed this way.' });
  }

  const db = require('./db');
  const sql = 'UPDATE users SET password_hash = ? WHERE username = ?';
  db.query(sql, [password_hash, username], (err, result) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Password updated successfully' });
  });
});

// --- OpenAI Law Search API ---
app.get('/api/openai-laws', async (req, res) => {
  const { query } = req.query;

  try {
    const prompt = `List the top 3 US cybersecurity laws related to: "${query}". For each law, return:
- Title
- One sentence description
- Source link
- MLA citation
Format your response as a JSON array with objects using keys: title, description, url, citation.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4',
    });

    const content = completion.choices[0].message.content;
    console.log('OpenAI raw response:', content);
    try {
      const parsed = JSON.parse(content);
      if (parsed.error) {
        return res.status(200).json({ error: parsed.error });
      }
      res.json({ results: parsed });
    } catch (parseError) {
      console.error('Failed to parse OpenAI JSON:', parseError);
      res.status(500).json({ message: 'Failed to parse OpenAI results.' });
    }
  } catch (err) {
    console.error('Error fetching OpenAI results:', err);
    res.status(500).json({ message: 'Failed to fetch OpenAI results' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

