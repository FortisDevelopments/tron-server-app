const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const bcrypt = require('bcrypt'); // Import bcrypt library

const tronAPI = require('./requests/tronAPI');


const app = express();
const PORT = 3000;
const SECRET_KEY = 'your-secret-key';
const db = mysql.createConnection({
  host: 'tron-db.cb8qw8k6tzdf.us-east-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Vitriolix2023$.',
  database: 'tron-db'
});

app.use(bodyParser.json());

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

// Login route

app.post('/login', (req, res) => {
  const { u_email, u_password } = req.body;

  db.query('SELECT * FROM users WHERE u_email = ?', [u_email], async (err, results) => {
    if (err) throw err;

    if (results.length === 0 || !(await bcrypt.compare(u_password, results[0].password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: results[0].id }, SECRET_KEY, { expiresIn: '1h' });

    res.json({ token });
  });
});

app.post('/register', async (req, res) => {
  const { u_email, u_password, u_username } = req.body;

  // Check if the u_email already exists
  db.query('SELECT * FROM users WHERE u_email = ?', [u_email], async (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Error registering user' });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(u_password, 10);

    // Insert the user into the database
    db.query('INSERT INTO users (u_email, u_password, u_username) VALUES (?, ?)', [u_email, hashedPassword, u_username], (err, results) => {
      if (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ message: 'Error registering user' });
      }

      res.json({ message: 'User registered successfully' });
    });
  });
}); 

// app.post('/registerAffiliated', (req, res) => {

// });

// Protected route to get user data
app.get('/getInfo', (req, res) => {
  const token = req.header('x-auth-token'); // Assuming token is sent in the request header

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.userId;

    // Fetch user data from the database based on userId
    db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Error fetching user data' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const user = results[0];
      res.json(user);
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// app.post('/registerAffiliated', (req, res) => {

// });

// app.post('/verifyTransaction', (req, res) => {
//   // u id, t id, sus
// });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});