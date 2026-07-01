import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Music Playlist API',
      version: '1.0.0',
      description:
        'REST API for the Music Playlist application. JWT auth via `Authorization: Bearer <accessToken>`.',
    },
    servers: [{ url: '/api', description: 'API root' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth' },
      { name: 'Users' },
      { name: 'Songs' },
      { name: 'Artists' },
      { name: 'Albums' },
      { name: 'Playlists' },
      { name: 'Comments' },
      { name: 'Likes' },
      { name: 'Favorites' },
      { name: 'Search' },
      { name: 'Dashboard' },
      { name: 'Notifications' },
      { name: 'Health' },
    ],
  },
  // Route files carry @openapi JSDoc annotations.
  apis: ['./src/routes/*.ts'],
});
