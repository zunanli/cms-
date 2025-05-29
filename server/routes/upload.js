const Router = require('koa-router');
const multer = require('@koa/multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

const router = new Router({ prefix: '/api/upload' });

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../uploads')
});

router.post('/chunk', upload.single('chunk'), async (ctx) => {
  try {
    const { uploadId, chunkIndex, totalChunks } = ctx.request.body;
    const file = ctx.request.file;

    if (!file) {
      ctx.status = 400;
      ctx.body = { error: 'No file uploaded' };
      return;
    }

    const chunkDir = path.join(__dirname, '../uploads', uploadId);
    await fs.mkdir(chunkDir, { recursive: true });
    
    const chunkPath = path.join(chunkDir, `${chunkIndex}`);
    await fs.rename(file.path, chunkPath);

    ctx.body = { 
      success: true,
      message: `Chunk ${chunkIndex} of ${totalChunks} uploaded successfully`
    };
  } catch (error) {
    console.error('Chunk upload error:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

router.post('/complete', async (ctx) => {
  try {
    const { uploadId, fileName } = ctx.request.body;
    if (!uploadId || !fileName) {
      ctx.status = 400;
      ctx.body = { error: 'Missing uploadId or fileName' };
      return;
    }

    const chunkDir = path.join(__dirname, '../uploads', uploadId);
    const finalPath = path.join(__dirname, '../uploads', fileName);

    try {
      await fs.access(chunkDir);
    } catch (err) {
      ctx.status = 404;
      ctx.body = { error: 'Upload session not found' };
      return;
    }

    const chunks = await fs.readdir(chunkDir);
    const sortedChunks = chunks.sort((a, b) => parseInt(a) - parseInt(b));

    const writeStream = fsSync.createWriteStream(finalPath);
    
    for (const chunk of sortedChunks) {
      const chunkPath = path.join(chunkDir, chunk);
      const chunkData = await fs.readFile(chunkPath);
      writeStream.write(chunkData);
    }
    
    await new Promise((resolve, reject) => {
      writeStream.end((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await fs.rmdir(chunkDir, { recursive: true });

    ctx.body = { 
      success: true,
      message: 'File upload completed successfully',
      path: fileName
    };
  } catch (error) {
    console.error('Complete upload error:', error);
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

module.exports = router; 