import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { uploadController } from '../controllers/upload.controller'
import { uploadMiddleware } from '../middlewares/upload.middleware'
import { authMiddleware } from '../middlewares/auth.middleware'
import { tenantMiddleware } from '../middlewares/tenant.middleware'

const router = Router()

router.use(authMiddleware, tenantMiddleware)

// Wrapper pour intercepter les erreurs multer (taille, type) avant qu'elles remontent en 500
function handleUpload(req: Request, res: Response, next: NextFunction) {
  uploadMiddleware.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Fichier trop lourd — 2 MB maximum' : err.message
      res.status(400).json({ success: false, error: { code: 'UPLOAD_ERROR', message: msg } })
      return
    }
    if (err instanceof Error) {
      res.status(400).json({ success: false, error: { code: 'UPLOAD_ERROR', message: err.message } })
      return
    }
    next()
  })
}

router.post('/image', handleUpload, uploadController.uploadImage)

export default router
