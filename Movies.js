var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

try {
    mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true });
    mongoose.set('useCreateIndex', true);
    mongoose.set('useFindAndModify', false);
} catch (error) {
    console.log("MongoDB connection error: " + error);
}

// Movie schema
var MovieSchema = new Schema({
    title: { type: String, required: true, index: true },
    releaseDate: { 
        type: Number, 
        required: true,
        min: [1900, 'Must be at least 1900'],
        max: [2100, 'Must be no more than 2100'] 
    },
    genre: { 
        type: String, 
        required: true,
        enum: [
            'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 
            'Horror', 'Mystery', 'Thriller', 'Western', 'Science Fiction'
        ]
    },
    actors: {
        type: [{
            actorName: { type: String, required: true },
            characterName: { type: String, required: true }
        }],
        required: true,
        validate: {
            validator: function(actors) {
                return actors.length >= 3;
            },
            message: 'You must have at least 3 actors'
        }
    }
});

// Return the model
module.exports = mongoose.model('Movie', MovieSchema);
