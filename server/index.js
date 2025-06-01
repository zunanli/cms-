const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const fs = require('fs').promises;
const path = require('path');

// Import routes
const authRouter = require('./routes/auth');
const uploadRouter = require('./routes/upload');

// Import middleware
const { verifyToken, checkPermissions } = require('./middleware/auth');

const app = new Koa();

// Add CORS middleware
app.use(cors({
  origin: ctx => {
    const origin = ctx.request.header.origin;
    if (origin === 'http://localhost:3000') {
      return origin;
    }
    return false;
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
  maxAge: 86400
}));

// Add request logging middleware
app.use(async (ctx, next) => {
  console.log(`${ctx.method} ${ctx.url}`);
  console.log('Request headers:', ctx.headers);
  await next();
  console.log('Response Status:', ctx.status);
  console.log('Response headers:', ctx.response.headers);
});

// Add body parsing middleware
app.use(bodyParser({
  enableTypes: ['json', 'form'],
  formLimit: '10mb',
  jsonLimit: '10mb',
  strict: false,
  onerror: (err, ctx) => {
    console.error('Body parsing error:', err);
    ctx.throw(422, 'Body parsing failed');
  }
}));

// Add token verification middleware
app.use(verifyToken);

// Add permission checking middleware
app.use(checkPermissions);

// Use routes
app.use(authRouter.routes());
app.use(authRouter.allowedMethods());
app.use(uploadRouter.routes());
app.use(uploadRouter.allowedMethods());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 