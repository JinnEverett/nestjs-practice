import express from 'express';

const fail = (status, message) => Object.assign(new Error(message), { status, expose: true });

export function ordersRouter(store) {
  const router = express.Router();
  router.use(express.json());

  router.param('id', (req, res, next, raw) => {
    if (!/^[1-9]\d*$/.test(raw)) return next(fail(400, 'Invalid id'));
    const id = Number(raw);
    const order = store.get(id);
    if (!order) return next(fail(404, 'Order not found'));
    req.orderId = id;
    req.order = order;
    next();
  });

  router.get('/', (req, res) => res.json(store.list()));
  router.get('/:id', (req, res) => res.json(req.order));
  router.post('/', (req, res) => {
    const order = store.create(req.body ?? {});
    res.status(201).location(`/orders/${order.id}`).json(order);
  });
  router.patch('/:id', (req, res) => res.json(store.update(req.orderId, req.body ?? {})));
  router.delete('/:id', (req, res) => {
    store.remove(req.orderId);
    res.status(204).end();
  });
  return router;
}
