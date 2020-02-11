const express = require('express');

const Message = require('../models/message');
const auth = require('../middleware/auth');

const { RECORD_UPDATED } = require('../constants/message');

const router = new express.Router();

router.post('/messages', auth, async (req, res) => {
  const message = new Message({ ...req.body, user: req.user._id });
  try {
    await message.save();

    await message.populate('user').execPopulate();

    res.status(201).send({ message });
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
});

router.get('/messages', auth, async (req, res) => {
  const sort = { createdAt: 'desc' };

  try {
    const messages = await Message.find()
      .sort(sort)
      .populate('user');

    if (!messages) return res.status(404).send();

    res.send({ messages });
  } catch (e) {
    if (e.name === 'CastError') res.status(400).send({ error: 'Something wrong happened' });
    res.status(500).send();
  }
});

router.patch('/messages/like', auth, async (req, res) => {
  try {
    const queries = Object.keys(req.query);
    const allowedQueries = ['messageId'];
    const isValidQuery = queries.every(query => allowedQueries.includes(query));

    if (!isValidQuery) return res.status(400).send();

    const message = await Message.findById(req.query.messageId);
    if (!message) return res.status(400).send();

    if (!message.likes.includes(req.user._id)) message.likes.push(req.user._id);

    await message.save();

    res.send({ message, msg: RECORD_UPDATED });
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;
