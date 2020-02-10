const mongoose = require('mongoose');
const passwordValidator = require('password-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { USER_ALREADY_EXIST, LOGIN_FAIL, PASSWORD_IS_INVALID } = require('../constants/message');

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 7,
      trim: true,
      validate(value) {
        const schema = new passwordValidator();
        schema
          .is()
          .min(7)
          .is()
          .max(100)
          .has()
          .uppercase()
          .has()
          .lowercase()
          .has()
          .digits()
          .has()
          .symbols();
        if (!schema.validate(value)) throw new Error(PASSWORD_IS_INVALID);
      },
    },
    tokens: [
      {
        token: {
          type: String,
          require: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

userSchema.methods.toJSON = function() {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;

  return userObject;
};

userSchema.methods.generateAuthToken = async function() {
  const user = this;

  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  user.tokens = user.tokens.concat({ token });

  await user.save();

  return token;
};

userSchema.statics.findByCredentials = async (userName, password) => {
  const user = await User.findOne({ userName });

  if (!user) throw new Error(LOGIN_FAIL);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error(LOGIN_FAIL);

  return user;
};

//Hash the plain text password before save
userSchema.pre('save', async function(next) {
  const user = this;
  if (user.isModified('password')) user.password = await bcrypt.hash(user.password, 8);

  next();
});

userSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error(USER_ALREADY_EXIST));
  } else {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
