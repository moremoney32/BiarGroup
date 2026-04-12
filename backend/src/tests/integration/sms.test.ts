import request from 'supertest'
import app from '../../app'

describe('SMS Campaigns API', () => {
  let authToken: string

  beforeAll(async () => {
    // TODO: login and get token
  })

  describe('GET /api/v1/sms/campaigns', () => {
    it('retourne 401 sans token', async () => {
      const res = await request(app).get('/api/v1/sms/campaigns')
      expect(res.status).toBe(401)
    })

    it('retourne la liste des campagnes', async () => {
      // TODO: implement
    })
  })

  describe('POST /api/v1/sms/campaigns', () => {
    it('retourne 400 si données invalides', async () => {
      // TODO: implement
    })

    it('crée une campagne avec succès', async () => {
      // TODO: implement
    })
  })
})
