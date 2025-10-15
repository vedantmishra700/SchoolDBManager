import fs from 'fs';
import path from 'path';
import formidable from 'formidable-serverless';
import pool from '../../../lib/db';

export const config = {
  api: { bodyParser: false }, // important for file uploads
};

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'schoolImages');

async function ensureUploadDir() {
  try {
    await fs.promises.access(UPLOAD_DIR);
  } catch (err) {
    await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// move file (rename if possible, fallback to copy+unlink)
async function moveFile(oldPath, newPath) {
  try {
    await fs.promises.rename(oldPath, newPath);
  } catch (err) {
    // sometimes rename fails across devices — fallback to copy + unlink
    await fs.promises.copyFile(oldPath, newPath);
    await fs.promises.unlink(oldPath);
  }
}

const handler = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await ensureUploadDir();

      const form = new formidable.IncomingForm({
        uploadDir: UPLOAD_DIR,
        keepExtensions: true,
        maxFileSize: 5 * 1024 * 1024, // 5MB
      });

      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error('formidable parse error:', err);
          return res.status(500).json({ message: 'Upload error' });
        }

        // server-side validation of required fields
        const { name, address, city, state, contact, email_id } = fields;
        if (!name || !address || !city) {
          return res.status(400).json({ message: 'Missing required fields (name, address, city)' });
        }

        let imagePath = '';

        // handle file(s) robustly. files.image could be undefined, an object, or array
        const maybeFile = files?.image;
        if (maybeFile) {
          // normalize to single file object
          const file = Array.isArray(maybeFile) ? maybeFile[0] : maybeFile;

          // oldPath depending on formidable version
          const oldPath = file.filepath || file.path || file.tempFilePath || null;
          if (oldPath) {
            // create a safe, unique filename
            const originalName = file.originalFilename || file.name || 'upload';
            // sanitize filename (keep extension)
            const ext = path.extname(originalName) || '.jpg';
            const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 40);
            const newFilename = `${Date.now()}_${base}${ext}`;
            const newPath = path.join(UPLOAD_DIR, newFilename);

            try {
              await moveFile(oldPath, newPath);
              imagePath = `/schoolImages/${newFilename}`;
            } catch (moveErr) {
              console.error('file move error:', moveErr);
              // If move fails, continue without image but log error
            }
          }
        }

        // Insert into DB
        try {
          const sql = `INSERT INTO schools (name, address, city, state, contact, image, email_id)
                       VALUES (?, ?, ?, ?, ?, ?, ?)`;
          const params = [
            name,
            address,
            city,
            state || '',
            contact || '',
            imagePath || '',
            email_id || '',
          ];
          const [result] = await pool.query(sql, params);
          return res.status(200).json({ id: result.insertId, message: 'School added', image: imagePath });
        } catch (dbErr) {
          console.error('DB insert error:', dbErr);
          return res.status(500).json({ message: 'Database error' });
        }
      });
    } catch (e) {
      console.error('API error:', e);
      return res.status(500).json({ message: 'Server error' });
    }
  } else if (req.method === 'GET') {
    // Return list of schools for showSchools.jsx
    try {
      const [rows] = await pool.query('SELECT id, name, address, city, image FROM schools ORDER BY id DESC');
      return res.status(200).json(rows);
    } catch (e) {
      console.error('DB query error:', e);
      return res.status(500).json({ message: 'DB error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

export default handler;
