const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.Promise = global.Promise;
// Hook up the database
mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Models
const { User } = require('./models/user');
// Custom Middleware
const { auth } = require('./middleware/auth');

// USER API ROUTES ***********************************************

app.get('/api/users/auth', auth, (req, res) => {
  res.status(200).json({
    user: req.user
  });
});

app.post('/api/users/register', (req, res) => {
  const user = new User(req.body);
  user.save((err, doc) => {
    if (err) return res.json({ success: false, err });
    res.status(200).json({
      success: true,
      userdata: doc
    });
  });
});

app.post('/api/users/login', (req, res) => {
  // find the email
  User.findOne({ email: req.body.email }, (err, user) => {
    if (!user) return res.json({ success: false, message: 'No email found' });
    // Check the password
    user.comparePassword(req.body.password, (err, isMatch) => {
      if (!isMatch) {
        return res.json({ success: false, message: 'Wrong password' });
      }
      // Generate the auth token
      user.generateToken((err, user) => {
        if (err) return res.status(400).send(err);
        res
          .cookie('w_auth', user.token)
          .status(200)
          .json({
            success: true,
            message: 'Login successful'
          });
      });
    });
  });
});

// LOGOUT

app.get('/api/users/logout', auth, (req, res) => {
  User.findOneAndUpdate(
    { _id: req.user._id },
    { token: '', isAuth: false },
    (err, doc) => {
      if (err) return res.json({ success: false, err });
      return res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    }
  );
});

const port = process.env.PORT;
app.listen(port, () => {
  console.log('app running at port 3000');
});
