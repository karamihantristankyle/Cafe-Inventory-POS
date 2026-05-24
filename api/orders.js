const { createOrder, listOrders } = require('./_store');

module.exports = function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(listOrders());
  }

  if (req.method === 'POST') {
    try {
      const result = createOrder(req.body || {});
      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
};
