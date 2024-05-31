const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

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
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
const Exercise = mongoose.model('Excersice', excersiceSchema);


app.use(cors())
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

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

// Endpoint to create a new excerise
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  const exerciseData = {
    user_id: userId,
    description,
    duration: parseInt(duration),
    date: date ? new Date(date).toDateString() : new Date().toDateString()
  };

  const newExercise = new Exercise(exerciseData);
  newExercise.save((err, savedExercise) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    User.findById(userId, (err, user) => {
      if (err || !user) {
        return res.status(500).json({ error: 'User not found' });
      }

      res.json({
        username: user.username,
        description: savedExercise.description,
        duration: savedExercise.duration,
        date: savedExercise.date,
        _id: savedExercise._id
      });
    });
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  User.findById(userId, (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: 'User not found' });
    }

    let query = { user_id: userId };

    if (from) {
      query.date = { ...query.date, $gte: new Date(from).toDateString() };
    }
    if (to) {
      query.date = { ...query.date, $lte: new Date(to).toDateString() };
    }

    let findQuery = Exercise.find(query).select('-_id description duration date');
    
    if (limit) {
      findQuery = findQuery.limit(parseInt(limit));
    }

    findQuery.exec((err, exercises) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        _id: userId,
        username: user.username,
        count: exercises.length,
        log: exercises
      });
    });
  });
});


