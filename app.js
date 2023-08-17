const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt'); // Import bcrypt library
const util = require('util');
const tronAPI = require('./requests/tronAPI');


const app = express();
const PORT = 3000;
const SECRET_KEY = '7958827dbf1f4b1d4492fcbad782274802d3d3aff041e975b36d3e1f120935f8';

// const crypto = require('crypto');

// // Generate a secure random buffer (32 bytes)
// const secretKeyBuffer = crypto.randomBytes(32);

// // Convert the buffer to a hexadecimal string
// const secretKey = secretKeyBuffer.toString('hex');

// console.log('Generated Secret Key:', secretKey);

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
    res.setHeader('Access-Control-Allow-Origin', '*'); // Replace with your frontend's origin
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-auth-token'); // Add x-auth-token here
    next();
});

app.get("/health-check", (req, res) => {
	res.json({ message: "Server up and running"  });
})

// const query = util.promisify(pool.query).bind(pool);

// Register route

app.post('/register', async (req, res) => {
  const { u_email, u_password, u_username } = req.body;

  try {
    // Check if the u_email already exists
    const [results] = await pool.query('SELECT * FROM users WHERE u_email = ?', [u_email]);

    if (results.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(u_password, 10);

    // Insert the user into the database
    await pool.query('INSERT INTO users (u_email, u_password, u_username) VALUES (?, ?, ?)', [u_email, hashedPassword, u_username]);

    res.json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  try {
    const { u_email, u_password } = req.body;

    if (!u_email || !u_password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const connection = await pool.getConnection();

    const [rows] = await connection.execute('SELECT u_email, u_password FROM users WHERE u_email = ?', [u_email]);

    connection.release(); // Release the connection back to the pool

    if (rows.length === 0 || !(await bcrypt.compare(u_password, rows[0].u_password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: rows[0].u_email }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Error during login:', error);
    console.error(req.body);
    res.status(500).json({ message: 'An error occurred during login' });
  }
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
    pool.query('INSERT INTO users (u_email, u_password, u_username, u_afiliado) VALUES (?,?,?,?)', [u_email, hashedPassword, u_username, u_afiliado], (err, results) => {
      if (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ message: 'Error registering user' });
      }

      res.json({ message: 'User registered successfully' });
    });
  });
});

app.post('/updatePlan', async (req, res) => {
<<<<<<< Updated upstream
  const {u_wallet_id,u_transactions, u_subscription_type } = req.body;
  const token = req.header('x-auth-token'); 

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  console.error(token)
  const decoded = jwt.decode(token, SECRET_KEY);
  console.error(decoded)
  const userId = decoded.userId
  console.error(userId)

=======
  const { u_id, u_wallet_id, u_subscription_type } = req.body;
>>>>>>> Stashed changes

   // Update the user data in the database
   const connection = await pool.getConnection();
   try {
     await connection.beginTransaction();

     await connection.query('UPDATE users SET u_subscription_type = ?, u_wallet_id = ?, u_transactions=?, u_plan_start_date=CURRENT_TIMESTAMP, u_plan_end_date=TIMESTAMPADD(YEAR ,1,CURRENT_TIMESTAMP()) WHERE u_email = ?' , [u_subscription_type, u_wallet_id,u_transactions, userId]);

     await connection.commit();
     res.json({ message: 'User info updated successfully' });
   } catch (error) {
     await connection.rollback();
     console.error('Database error:', error);
     res.status(500).json({ message: 'Error updating user info' });
   } finally {
     connection.release();
   }

});


// Protected route to get user data
app.get('/getInfo',async (req, res) => {
  const token = req.header('x-auth-token'); // Assuming token is sent in the request header
 
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  console.error(token)
  const decoded = jwt.decode(token, SECRET_KEY);
  console.error(decoded)
  const userId = decoded.userId
  console.error(userId)


  try {
    // Use the pool to execute the query using promises
    const [results, fields] = await pool.query('SELECT * FROM users WHERE u_email = ?', [userId]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = results[0];
    res.json(user);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }

});

// app.post('/verifyTransaction', (req, res) => {
//   // u id, t id, sus
// });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});