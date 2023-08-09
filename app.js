const express = require('express');
const tronAPI = require('./tronAPI');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'your-secret-key';
const db = mysql.createConnection({
  host: 'localhost',
  user: 'your-username',
  password: 'your-password',
  database: 'your-database-name'
});

// Middleware to enable CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/transactions/:address', async (req, res) => {
  const address = req.params.address;
  try {
    const transactions = await tronAPI.getTransactionsByAddress(address);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use(bodyParser.json());

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Find user by username
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) throw err;

    if (results.length === 0 || results[0].password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create a JWT token
    const token = jwt.sign({ userId: results[0].id }, SECRET_KEY, { expiresIn: '1h' });

    res.json({ token });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});