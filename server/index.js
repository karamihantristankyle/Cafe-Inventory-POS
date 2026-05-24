const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

// Database setup
const dbPath = path.resolve(__dirname, 'coffee_shop.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Products table
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT,
      image_url TEXT
    )`);

    // Orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      subtotal REAL NOT NULL,
      tax REAL NOT NULL,
      total REAL NOT NULL,
      payment_method TEXT,
      payment_status TEXT,
      customer_name TEXT
    )`);

    // Order Items table
    db.run(`CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product_id INTEGER,
      quantity INTEGER,
      unit_price REAL,
      modifiers TEXT,
      FOREIGN KEY (order_id) REFERENCES orders (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
    )`);

    // Initial Data
    db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
      if (row.count === 0) {
        const products = [
          ['Espresso', 2.50, 'Coffee', 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400'],
          ['Americano', 3.00, 'Coffee', 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=400'],
          ['Latte', 3.50, 'Coffee', 'https://images.pexels.com/photos/350478/pexels-photo-350478.jpeg?auto=compress&cs=tinysrgb&w=400'],
          ['Cappuccino', 3.50, 'Coffee', 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400'],
          ['Green Tea', 2.75, 'Tea', 'https://images.pexels.com/photos/1417945/pexels-photo-1417945.jpeg?auto=compress&cs=tinysrgb&w=400'],
          ['Croissant', 2.25, 'Pastry', 'https://images.pexels.com/photos/3892469/pexels-photo-3892469.jpeg?auto=compress&cs=tinysrgb&w=400'],
          ['Blueberry Muffin', 2.50, 'Pastry', 'https://images.pexels.com/photos/1132558/pexels-photo-1132558.jpeg?auto=compress&cs=tinysrgb&w=400'],
          ['Chocolate Cookie', 1.50, 'Pastry', 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=400'],
          ['Spaghetti Bolognese', 8.50, 'Pasta', 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=400'],
          ['Carbonara', 9.00, 'Pasta', 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?auto=compress&cs=tinysrgb&w=400'],
          ['Pesto Pasta', 8.75, 'Pasta', 'https://images.pexels.com/photos/14737/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=400'],
          ['Beef Tapa with Rice', 7.50, 'Rice Meal', 'https://images.pexels.com/photos/674483/pexels-photo-674483.jpeg?auto=compress&cs=tinysrgb&w=400'],
          ['Chicken Adobo with Rice', 7.00, 'Rice Meal', 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=400'],
          ['Pork Sisig with Rice', 8.00, 'Rice Meal', 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=400']
        ];
        const stmt = db.prepare("INSERT INTO products (name, price, category, image_url) VALUES (?, ?, ?, ?)");
        products.forEach(p => stmt.run(p));
        stmt.finalize();
      }
    });
  });
}

// API Endpoints
app.get('/api/products', (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/orders', (req, res) => {
  db.all(`
    SELECT o.*, GROUP_CONCAT(p.name || ' (x' || oi.quantity || ')') as items_summary
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    GROUP BY o.id
    ORDER BY o.timestamp DESC
    LIMIT 50
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/orders', (req, res) => {
  const { subtotal, tax, total, payment_method, items, customer_name } = req.body;
  
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    
    db.run(
      "INSERT INTO orders (subtotal, tax, total, payment_method, payment_status, customer_name) VALUES (?, ?, ?, ?, ?, ?)",
      [subtotal, tax, total, payment_method, 'Success', customer_name || 'Guest'],
      function(err) {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: err.message });
        }
        
        const orderId = this.lastID;
        const stmt = db.prepare("INSERT INTO order_items (order_id, product_id, quantity, unit_price, modifiers) VALUES (?, ?, ?, ?, ?)");
        
        items.forEach(item => {
          stmt.run(orderId, item.id, item.quantity, item.price, JSON.stringify(item.modifiers || {}));
        });
        
        stmt.finalize((err) => {
          if (err) {
            db.run("ROLLBACK");
            res.status(500).json({ error: err.message });
          } else {
            db.run("COMMIT");
            res.status(201).json({ id: orderId, message: "Order placed successfully" });
          }
        });
      }
    );
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
