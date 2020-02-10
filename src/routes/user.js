const express = require('express');

const User = require('../models/user');
const auth = require('../middleware/auth');
const {
  INVALID_UPDATES,
  RECORD_DELETED,
  RECORD_UPDATED,
  PHOTO_UPDATED,
  PASSWORD_CHANGE_FAIL,
  PASSWORD_UPDATED,
  LOGIN_FAIL,
  SEARCH_BY_ID_FAIL,
} = require('../constants/message');

const router = new express.Router();

router.post('/users', async (req, res) => {
  const user = new User(req.body);
  try {
    const token = await user.generateAuthToken();

    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
});

router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.userName, req.body.password);

    // user.password = req.body.password;

    const token = await user.generateAuthToken();

    res.send({ user, token });
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
});

module.exports = router;
