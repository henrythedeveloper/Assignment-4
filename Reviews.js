var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

// Review schema
var ReviewSchema = new Schema({
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    username: { type: String, required: true },
    review: { type: String, required: true },
    rating: { 
        type: Number, 
        required: true, 
        min: [0, 'Rating must be between 0 and 5'], 
        max: [5, 'Rating must be between 0 and 5'] 
    }
});

// Return the model
module.exports = mongoose.model('Review', ReviewSchema);
