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
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true },
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

// Endpoint to get a list of all users
app.get('/api/users', (req, res) => {
  User.find({}, 'username _id', (err, users) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(users);
  });
});

// Endpoint to create a new excerise
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  // Create the exercise data
  const exerciseData = {
    user_id: userId,
    description,
    duration: parseInt(duration),
    date: date ? new Date(date) : new Date()
  };

  // Save the exercise
  const newExercise = new Exercise(exerciseData);
  newExercise.save((err, savedExercise) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Find the user and include the exercise data in the response
    User.findById(userId, (err, user) => {
      if (err || !user) {
        return res.status(400).json({ error: 'User not found' });
      }

      res.json({
        _id: user._id,
        username: user.username,
        description: savedExercise.description,
        duration: savedExercise.duration,
        date: new Date(savedExercise.date).toDateString()
      });
    });
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const { from } = req.query;
  const { to } = req.query;
  const { limit } = req.query;

  // Find the user by ID
  User.findById(userId, (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Build the query for exercises
    let query = { user_id: userId };

    if (from) {
      query.date = { ...query.date, $gte: new Date(from) };
    }
    if (to) {
      query.date = { ...query.date, $lte: new Date(to) };
    }

    let findQuery = Exercise.find(query).select('description duration date');

    if (limit) {
      findQuery = findQuery.limit(parseInt(limit));
    }

    // Execute the query
    findQuery.exec((err, exercises) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Format the log with dates in 'toDateString' format
      const log = exercises.map(ex => ({
        description: ex.description,
        duration: ex.duration,
        date: new Date(ex.date).toDateString()
      }));

      // Return the response
      res.json({
        _id: userId,
        username: user.username,
        count: exercises.length,
        log: log
      });
    });
  });
});



