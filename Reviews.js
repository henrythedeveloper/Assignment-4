var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

try {
    mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true });
    mongoose.set('useCreateIndex', true);
    mongoose.set('useFindAndModify', false);
    console.log("MongoDB connection successful");
} catch (error) {
    console.log("MongoDB connection error: " + error);
}

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
