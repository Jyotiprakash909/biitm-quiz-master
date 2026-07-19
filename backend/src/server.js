require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const morgan = require('morgan');

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*', // To be restricted in production
    methods: ['GET', 'POST'],
  },
});

// Pass io to routes/controllers if needed or handle in a separate module
require('./sockets/socketManager')(io);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger Documentation
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
const adminRoutes = require('./routes/adminRoutes');
const resultRoutes = require('./routes/resultRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const globalQuestionRoutes = require('./routes/globalQuestionRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/questions', globalQuestionRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/results', resultRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.send('BIITM Quiz Master API is running...');
});

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Trigger nodemon restart
