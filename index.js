const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Successfully connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  });


// Define the schema for a User
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
});
const User = mongoose.model('User', userSchema);

// Define the schema for a User
const excersiceSchema = new mongoose.Schema({
  username: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  },
});
const Excersice = mongoose.model('Excersice', excersiceSchema);


app.use(cors())
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Endpoint to create a new user
app.post('/api/users', (req, res) => {
  const userData = {
    username: req.body.username
  };

  const newUser = new User(userData);
  newUser.save((err, data) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(200).send(data);
  });
});


