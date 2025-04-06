/*
CSC3916 HW4
File: Server.js
Description: Web API scaffolding for Movie API
 */
require('dotenv').config();


var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');
var mongoose = require('mongoose');

// For Google Analytics (Extra Credit)
var crypto = require('crypto');
var rp = require('request-promise');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

// Google Analytics tracking (Extra Credit)
const GA_TRACKING_ID = process.env.GA_KEY;

function trackDimension(category, action, label, value, dimension, metric) {
    if (!GA_TRACKING_ID) {
        console.log('Google Analytics tracking ID not set. Skipping analytics.');
        return Promise.resolve();
    }

    var options = {
        method: 'GET',
        url: 'https://www.google-analytics.com/collect',
        qs: {
            // API Version.
            v: '1',
            // Tracking ID / Property ID.
            tid: GA_TRACKING_ID,
            // Random Client Identifier
            cid: crypto.randomBytes(16).toString("hex"),
            // Event hit type.
            t: 'event',
            // Event category.
            ec: category,
            // Event action.
            ea: action,
            // Event label.
            el: label,
            // Event value.
            ev: value,
            // Custom Dimension
            cd1: dimension,
            // Custom Metric
            cm1: metric
        },
        headers: { 'Cache-Control': 'no-cache' }
    };

    return rp(options)
        .then(() => console.log(`Analytics event sent: ${category} - ${action} - ${label} - ${dimension}`))
        .catch(err => console.error('Analytics error:', err));
}

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        if (!user) {
            return res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
            }
        })
    })
});

// Movie routes
router.route('/movies')
    .get(authJwtController.isAuthenticated, function (req, res) {
        // Return all movies, with reviews if requested
        if (req.query.reviews === 'true') {
            Movie.aggregate([
                {
                    $lookup: {
                        from: 'reviews',
                        localField: '_id',
                        foreignField: 'movieId',
                        as: 'reviews'
                    }
                }
            ]).exec(function (err, movies) {
                if (err) {
                    return res.status(500).send(err);
                }

                // Track analytics for each movie (Extra Credit)
                if (GA_TRACKING_ID) {
                    movies.forEach(movie => {
                        trackDimension(
                            movie.genre,
                            'GET /movies',
                            'API Request for Movie with Reviews',
                            '1',
                            movie.title,
                            '1'
                        ).catch(err => console.error(err));
                    });
                }

                return res.json(movies);
            });
        } else {
            Movie.find(function (err, movies) {
                if (err) {
                    return res.status(500).send(err);
                }
                return res.json(movies);
            });
        }
    })
    .post(authJwtController.isAuthenticated, function (req, res) {
        // Check required fields
        if (!req.body.title || !req.body.releaseDate || !req.body.genre) {
            return res.status(400).json({ success: false, message: 'Please provide title, releaseDate, and genre' });
        }

        // Validate actors array
        if (!req.body.actors || !Array.isArray(req.body.actors) || req.body.actors.length < 3) {
            return res.status(400).json({ success: false, message: 'Please provide at least 3 actors' });
        }

        for (let actor of req.body.actors) {
            if (!actor.actorName || !actor.characterName) {
                return res.status(400).json({ success: false, message: 'Each actor must have actorName and characterName' });
            }
        }

        // Create and save the movie
        var movie = new Movie();
        movie.title = req.body.title;
        movie.releaseDate = req.body.releaseDate;
        movie.genre = req.body.genre;
        movie.actors = req.body.actors;

        movie.save(function (err) {
            if (err) {
                return res.status(400).send(err);
            }
            res.json({ success: true, message: 'Movie created!', movie: movie });
        });
    });

// Movie by ID routes
router.route('/movies/:id')
    .get(authJwtController.isAuthenticated, function (req, res) {
        // Return specific movie, with reviews if requested
        var id = req.params.id;
        
        try {
            const objectId = mongoose.Types.ObjectId(id);
            
            if (req.query.reviews === 'true') {
                Movie.aggregate([
                    { $match: { _id: objectId } },
                    {
                        $lookup: {
                            from: 'reviews',
                            localField: '_id',
                            foreignField: 'movieId',
                            as: 'reviews'
                        }
                    }
                ]).exec(function (err, movie) {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    
                    if (!movie || movie.length === 0) {
                        return res.status(404).json({ success: false, message: 'Movie not found' });
                    }
                    
                    // Send analytics event (Extra Credit)
                    if (GA_TRACKING_ID) {
                        trackDimension(
                            movie[0].genre,
                            'GET /movies/:id',
                            'API Request for Specific Movie with Reviews',
                            '1',
                            movie[0].title,
                            '1'
                        ).catch(err => console.error(err));
                    }
                    
                    return res.json(movie[0]);
                });
            } else {
                Movie.findById(id, function (err, movie) {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    if (!movie) {
                        return res.status(404).json({ success: false, message: 'Movie not found' });
                    }
                    return res.json(movie);
                });
            }
        } catch (e) {
            return res.status(400).json({ success: false, message: 'Invalid ID format' });
        }
    })
    .put(authJwtController.isAuthenticated, function (req, res) {
        // Update movie
        var id = req.params.id;
        Movie.findById(id, function (err, movie) {
            if (err) {
                return res.status(500).send(err);
            }
            if (!movie) {
                return res.status(404).json({ success: false, message: 'Movie not found' });
            }

            // Update movie properties
            if (req.body.title) movie.title = req.body.title;
            if (req.body.releaseDate) movie.releaseDate = req.body.releaseDate;
            if (req.body.genre) movie.genre = req.body.genre;
            if (req.body.actors) movie.actors = req.body.actors;

            movie.save(function (err) {
                if (err) {
                    return res.status(400).send(err);
                }
                res.json({ success: true, message: 'Movie updated!', movie: movie });
            });
        });
    })
    .delete(authJwtController.isAuthenticated, function (req, res) {
        // Delete movie
        var id = req.params.id;
        Movie.findByIdAndRemove(id, function (err, movie) {
            if (err) {
                return res.status(500).send(err);
            }
            if (!movie) {
                return res.status(404).json({ success: false, message: 'Movie not found' });
            }

            // Also delete associated reviews
            Review.deleteMany({ movieId: id }, function (err) {
                if (err) {
                    console.log("Error deleting associated reviews:", err);
                }
                res.json({ success: true, message: 'Movie and associated reviews deleted!' });
            });
        });
    });

// Review routes
router.route('/reviews')
    .post(authJwtController.isAuthenticated, function (req, res) {
        // Create a new review
        if (!req.body.movieId || !req.body.review || req.body.rating === undefined) {
            return res.status(400).json({ success: false, message: 'Please provide movieId, review, and rating' });
        }

        // Check if movie exists
        Movie.findById(req.body.movieId, function (err, movie) {
            if (err) {
                return res.status(500).send(err);
            }
            if (!movie) {
                return res.status(404).json({ success: false, message: 'Movie not found' });
            }

            // Get username from JWT token
            var token = req.headers.authorization.split(' ')[1];
            var decoded = jwt.verify(token, process.env.SECRET_KEY);
            
            var review = new Review();
            review.movieId = req.body.movieId;
            review.username = decoded.username;
            review.review = req.body.review;
            review.rating = req.body.rating;

            review.save(function (err) {
                if (err) {
                    return res.status(400).send(err);
                }
                
                // Send analytics event (Extra Credit)
                if (GA_TRACKING_ID) {
                    trackDimension(
                        movie.genre,
                        'POST /reviews',
                        'API Request for Movie Review Creation',
                        '1',
                        movie.title,
                        '1'
                    ).catch(err => console.error(err));
                }
                
                res.json({ success: true, message: 'Review created!' });
            });
        });
    })
    .get(authJwtController.isAuthenticated, function (req, res) {
        // Get all reviews
        Review.find(function (err, reviews) {
            if (err) {
                return res.status(500).send(err);
            }
            res.json(reviews);
        });
    });

app.use('/', router);
app.listen(process.env.PORT || 8080);

module.exports = app; // for testing only