# CSC3916 Assignment 4 - Movie API with Reviews

This repository contains a RESTful API for managing movies and their reviews, building upon the previous assignment's movie database functionality. The API maintains separate collections for movies and reviews while allowing them to be retrieved together using MongoDB's aggregation capabilities.

## Project Description

This API provides endpoints for:
- User authentication (signup and signin)
- Movie management (create, read, update, delete)
- Review management (create and read)

The key feature is the ability to retrieve movies with their associated reviews by using the `reviews=true` query parameter. This demonstrates the use of MongoDB's `$lookup` aggregation to join separate collections at query time.

## Features

- **Secure Authentication**: JWT token-based authentication protects all endpoints
- **Movies Collection**: Complete CRUD operations for managing movie information
- **Reviews Collection**: Store and retrieve user reviews for movies
- **Data Aggregation**: Optional inclusion of reviews with movie data through query parameters
- **Google Analytics Integration**: Track movie views and review submissions (Extra Credit)

## Installation and Usage

### Prerequisites
- Node.js and npm
- MongoDB Atlas account

### Installation Steps

1. Clone the repository:
   ```
   git clone https://github.com/your-username/CSC3916_HW4.git
   cd CSC3916_HW4
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   DB=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   SECRET_KEY=your_jwt_secret_key
   GA_KEY=your_google_analytics_key (optional)
   ```

4. Start the server:
   ```
   npm start
   ```

### API Endpoints

#### Authentication
- `POST /signup`: Register a new user
  - Request body: `{ "name": "User Name", "username": "user@email.com", "password": "password" }`
  - Success response: `{ "success": true, "msg": "Successfully created new user." }`

- `POST /signin`: Login and receive JWT token
  - Request body: `{ "username": "user@email.com", "password": "password" }`
  - Success response: `{ "success": true, "token": "JWT token-value" }`

#### Movies
- `GET /movies`: Get all movies
  - Requires: JWT authentication
  - Response: Array of movie objects

- `GET /movies?reviews=true`: Get all movies with their reviews
  - Requires: JWT authentication
  - Response: Array of movie objects with reviews array included

- `GET /movies/:id`: Get a specific movie by ID
  - Requires: JWT authentication
  - Response: Movie object

- `GET /movies/:id?reviews=true`: Get a specific movie with its reviews
  - Requires: JWT authentication
  - Response: Movie object with reviews array included

- `POST /movies`: Create a new movie
  - Requires: JWT authentication
  - Request body: 
    ```json
    {
      "title": "Movie Title",
      "releaseDate": 2023,
      "genre": "Action",
      "actors": [
        { "actorName": "Actor 1", "characterName": "Character 1" },
        { "actorName": "Actor 2", "characterName": "Character 2" },
        { "actorName": "Actor 3", "characterName": "Character 3" }
      ]
    }
    ```
  - Success response: `{ "success": true, "message": "Movie created!", "movie": {...} }`

- `PUT /movies/:id`: Update an existing movie
  - Requires: JWT authentication
  - Request body: Updated movie fields
  - Success response: `{ "success": true, "message": "Movie updated!", "movie": {...} }`

- `DELETE /movies/:id`: Delete a movie and its reviews
  - Requires: JWT authentication
  - Success response: `{ "success": true, "message": "Movie and associated reviews deleted!" }`

#### Reviews
- `POST /reviews`: Create a review for a movie
  - Requires: JWT authentication
  - Request body: `{ "movieId": "movie-id-value", "review": "Review text", "rating": 4 }`
  - Success response: `{ "success": true, "message": "Review created!" }`

- `GET /reviews`: Get all reviews
  - Requires: JWT authentication
  - Response: Array of review objects

## Data Models

### Movie Schema
```javascript
{
  title: { type: String, required: true, index: true },
  releaseDate: { type: Number, required: true },
  genre: { 
    type: String, 
    enum: [
      'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 
      'Horror', 'Mystery', 'Thriller', 'Western', 'Science Fiction'
    ],
    required: true
  },
  actors: [{
    actorName: { type: String, required: true },
    characterName: { type: String, required: true }
  }]
}
```

### Review Schema
```javascript
{
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  username: { type: String, required: true },
  review: { type: String, required: true },
  rating: { type: Number, required: true, min: 0, max: 5 }
}
```

## Testing with Postman

You can test this API using the Postman collection linked below:

[<img src="https://run.pstmn.io/button.svg" alt="Run In Postman" style="width: 128px; height: 32px;">](https://app.getpostman.com/run-collection/39694219-b4e540dd-aae1-4976-9935-698f03adf9d8?action=collection%2Ffork&source=rip_markdown&collection-url=entityId%3D39694219-b4e540dd-aae1-4976-9935-698f03adf9d8%26entityType%3Dcollection%26workspaceId%3D569f717a-dd05-4684-b6f5-d59ba5d08496#?env%5BCSCI3916_HW4%5D=W3sia2V5IjoiQkFTRV9VUkwiLCJ2YWx1ZSI6Imh0dHBzOi8vYXNzaWdubWVudC00LTE4bWEub25yZW5kZXIuY29tIiwiZW5hYmxlZCI6dHJ1ZSwidHlwZSI6ImRlZmF1bHQiLCJzZXNzaW9uVmFsdWUiOiJodHRwczovL2Fzc2lnbm1lbnQtNC0xOG1hLm9ucmVuZGVyLmNvbSIsImNvbXBsZXRlU2Vzc2lvblZhbHVlIjoiaHR0cHM6Ly9hc3NpZ25tZW50LTQtMThtYS5vbnJlbmRlci5jb20iLCJzZXNzaW9uSW5kZXgiOjB9LHsia2V5IjoiTU9WSUVfSUQiLCJ2YWx1ZSI6IiIsImVuYWJsZWQiOnRydWUsInR5cGUiOiJkZWZhdWx0Iiwic2Vzc2lvblZhbHVlIjoiNjdmMmJiYzhjMDRmMDkwMDY1OTUwNDUxIiwiY29tcGxldGVTZXNzaW9uVmFsdWUiOiI2N2YyYmJjOGMwNGYwOTAwNjU5NTA0NTEiLCJzZXNzaW9uSW5kZXgiOjF9LHsia2V5IjoicmFuZG9tX3VzZXJuYW1lIiwidmFsdWUiOiIiLCJlbmFibGVkIjp0cnVlLCJ0eXBlIjoiYW55Iiwic2Vzc2lvblZhbHVlIjoidGVzdHVzZXJfMTY4MkBleGFtcGxlLmNvbSIsImNvbXBsZXRlU2Vzc2lvblZhbHVlIjoidGVzdHVzZXJfMTY4MkBleGFtcGxlLmNvbSIsInNlc3Npb25JbmRleCI6Mn0seyJrZXkiOiJyYW5kb21fcGFzc3dvcmQiLCJ2YWx1ZSI6IiIsImVuYWJsZWQiOnRydWUsInR5cGUiOiJhbnkiLCJzZXNzaW9uVmFsdWUiOiJQYXNzd29yZDI3NiIsImNvbXBsZXRlU2Vzc2lvblZhbHVlIjoiUGFzc3dvcmQyNzYiLCJzZXNzaW9uSW5kZXgiOjN9LHsia2V5IjoiYXV0aF90b2tlbiIsInZhbHVlIjoiIiwiZW5hYmxlZCI6dHJ1ZSwidHlwZSI6ImFueSIsInNlc3Npb25WYWx1ZSI6IkpXVC4uLiIsImNvbXBsZXRlU2Vzc2lvblZhbHVlIjoiSldUIGV5SmhiR2NpT2lKSVV6STFOaUlzSW5SNWNDSTZJa3BYVkNKOS5leUpwWkNJNklqWTNaakppWW1NMVl6QTBaakE1TURBMk5UazFNRFEwWXlJc0luVnpaWEp1WVcxbElqb2lkR1Z6ZEhWelpYSmZNVFk0TWtCbGVHRnRjR3hsTG1OdmJTSXNJbWxoZENJNk1UYzBNemsyTVRBek1uMC5qX3RXemxseXh2bGR4TGpkaFBzR1F0bUNIMno1MGtLZ25xZkpDLWFReUpVIiwic2Vzc2lvbkluZGV4Ijo0fV0=)

### Postman Environment Variables
Set up an environment in Postman with these variables:
- `BASE_URL`: Your API base URL (e.g., `http://localhost:8080` or your deployed URL)
- `JWT_TOKEN`: This will be automatically set after signing in
- `test_username`: Set by the Sign Up test
- `test_password`: Set by the Sign Up test
- `MOVIE_ID`: Set after creating a movie

The collection includes tests for all endpoints, including error cases.

## Google Analytics Integration (Extra Credit)

This API includes Google Analytics integration to track movie requests and review submissions. To enable this feature, add your Google Analytics Measurement ID to the `.env` file as `GA_KEY`.

When enabled, the API tracks:
- Movie views with the movie title as a custom dimension
- Review submissions with the movie title as a custom dimension
- All events include the movie genre as the event category

