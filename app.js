const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
// const mysql = require('mysql');
const mysql = require('mysql2');
const bcrypt = require('bcrypt'); // Import bcrypt library

const tronAPI = require('./requests/tronAPI');


const app = express();
const PORT = 3000;
const SECRET_KEY = 'your-secret-key';

// Create a MySQL connection pool
const pool = mysql.createPool({
  host     : 'tron-db.cb8qw8k6tzdf.us-east-1.rds.amazonaws.com',
  user     : 'admin',
  password : 'Vitriolix2023$.',
  database : 'tron-db',
  port     : 3306,
  waitForConnections: true,
  connectionLimit: 10, // Adjust as needed
  queueLimit: 0
});

app.use(bodyParser.json());
app.use(express.json()); // To parse JSON-encoded bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies


// Middleware to enable CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get("/", (req, res) => {
	res.json({ message: "Hello World"  });
})

app.get("/health-check", (req, res) => {
	res.json({ message: "Server up and running"  });
})

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

  pool.query('SELECT * FROM users WHERE u_email = ?', [u_email], async (err, results) => {
    if (err) throw err;

    if (results.length === 0 || !(await bcrypt.compare(u_password, results[0].password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: results[0].id }, SECRET_KEY, { expiresIn: '1h' });
    console.log("Generated token:", token);
    res.json({ token });
  });
});

app.post('/register', async (req, res) => {
  const { u_email, u_password, u_username } = req.body;
  // Check if the u_email already exists
  pool.query('SELECT * FROM users WHERE u_email = ?', [u_email], async (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Error registering user' });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(u_password, 10);

      // Insert the user into the database
      pool.query('INSERT INTO users (u_email, u_password, u_username) VALUES (?, ?, ?)', [u_email, hashedPassword, u_username], (err, results) => {
        if (err) {
          console.error('Registration error:', err);
          return res.status(500).json({ message: 'Error registering user' });
        }

        res.json({ message: 'User registered successfully' });
      });
    } catch (hashingError) {
      console.error('Hashing error:', hashingError);
      return res.status(500).json({ message: u_password });
    }
  });
});


app.post('/registerAffiliated', async (req, res) => {
  const { u_email, u_password, u_username, u_afiliado } = req.body;

  // Check if the u_email already exists
  pool.query('SELECT * FROM users WHERE u_email = ?', [u_email], async (err, results) => {
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
    pool.query('INSERT INTO users (u_email, u_password, u_username, u_afiliado) VALUES (?, ?)', [u_email, hashedPassword, u_username, u_afiliado], (err, results) => {
      if (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ message: 'Error registering user' });
      }

      res.json({ message: 'User registered successfully' });
    });
  });
}); 


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
    pool.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
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

// app.post('/verifyTransaction', (req, res) => {
//   // u id, t id, sus
// });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});