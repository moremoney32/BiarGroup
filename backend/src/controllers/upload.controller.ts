import { Request, Response } from 'express'
import { sendSuccess, sendError } from '../helpers/response.helper'

export const uploadController = {
  async uploadImage(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      sendError(res, 400, 'NO_FILE', 'Aucun fichier fourni')
      return
    }

    const baseUrl = (process.env.API_BASE_URL ?? `http://localhost:${process.env.PORT ?? 5000}`).replace(/\/$/, '')
    const url = `${baseUrl}/uploads/${req.file.filename}`

    sendSuccess(res, { url, filename: req.file.filename, size: req.file.size }, 'Image uploadée')
  },
}
