const fs = require('fs');
const os = require('os');
const path = require('path');

const DATA_FILE = path.join(os.tmpdir(), 'cafe-inventory-pos.json');

const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Espresso', price: 2.5, category: 'Coffee', image_url: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 2, name: 'Americano', price: 3.0, category: 'Coffee', image_url: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 3, name: 'Latte', price: 3.5, category: 'Coffee', image_url: 'https://images.pexels.com/photos/350478/pexels-photo-350478.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 4, name: 'Cappuccino', price: 3.5, category: 'Coffee', image_url: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 5, name: 'Green Tea', price: 2.75, category: 'Tea', image_url: 'https://images.pexels.com/photos/1417945/pexels-photo-1417945.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 6, name: 'Croissant', price: 2.25, category: 'Pastry', image_url: 'https://images.pexels.com/photos/3892469/pexels-photo-3892469.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 7, name: 'Blueberry Muffin', price: 2.5, category: 'Pastry', image_url: 'https://images.pexels.com/photos/1132558/pexels-photo-1132558.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 8, name: 'Chocolate Cookie', price: 1.5, category: 'Pastry', image_url: 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 9, name: 'Spaghetti Bolognese', price: 8.5, category: 'Pasta', image_url: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 10, name: 'Carbonara', price: 9.0, category: 'Pasta', image_url: 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 11, name: 'Pesto Pasta', price: 8.75, category: 'Pasta', image_url: 'https://images.pexels.com/photos/14737/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=400' },
  { id: 12, name: 'Beef Tapa with Rice', price: 7.5, category: 'Rice Meal', image_url: 'https://images.pexels.com/photos/674483/pexels-photo-674483.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 13, name: 'Chicken Adobo with Rice', price: 7.0, category: 'Rice Meal', image_url: 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 14, name: 'Pork Sisig with Rice', price: 8.0, category: 'Rice Meal', image_url: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=400' },
];

function getDefaultStore() {
  return {
    products: DEFAULT_PRODUCTS,
    orders: [],
    nextOrderId: 1,
  };
}

function ensureStore() {
  if (!fs.existsSync(DATA_FILE)) {
    const store = getDefaultStore();
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
    return store;
  }

  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (error) {
    const store = getDefaultStore();
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
    return store;
  }
}

function saveStore(store) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function listProducts() {
  return ensureStore().products;
}

function listOrders() {
  const store = ensureStore();

  return [...store.orders]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50)
    .map((order) => ({
      ...order,
      items_summary: order.items.map((item) => `${item.name} (x${item.quantity})`).join(', '),
    }));
}

function createOrder(payload) {
  const store = ensureStore();
  const productMap = new Map(store.products.map((product) => [product.id, product]));
  const items = Array.isArray(payload.items) ? payload.items : [];

  if (items.length === 0) {
    throw new Error('Order items are required.');
  }

  const normalizedItems = items.map((item) => {
    const product = productMap.get(Number(item.id));

    if (!product) {
      throw new Error(`Unknown product id: ${item.id}`);
    }

    return {
      product_id: product.id,
      name: product.name,
      quantity: Number(item.quantity) || 0,
      unit_price: Number(item.price ?? product.price),
      modifiers: item.modifiers || {},
    };
  });

  const order = {
    id: store.nextOrderId,
    timestamp: new Date().toISOString(),
    subtotal: Number(payload.subtotal) || 0,
    tax: Number(payload.tax) || 0,
    total: Number(payload.total) || 0,
    payment_method: payload.payment_method || 'Cash',
    payment_status: 'Success',
    customer_name: payload.customer_name || 'Guest',
    items: normalizedItems,
  };

  store.nextOrderId += 1;
  store.orders.push(order);
  saveStore(store);

  return {
    id: order.id,
    message: 'Order placed successfully',
  };
}

module.exports = {
  createOrder,
  listOrders,
  listProducts,
};
