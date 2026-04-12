import request from 'supertest'
import app from '../../app'

describe('POST /api/v1/auth/login', () => {
  it('retourne 400 si body invalide', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({})
    expect(res.status).toBe(400)
  })

  it('retourne 401 si mot de passe incorrect', async () => {
    // TODO: implement with test DB
  })

  it('retourne 200 avec tokens si credentials valides', async () => {
    // TODO: implement with test DB
  })
})

describe('POST /api/v1/auth/register', () => {
  it('retourne 400 si email invalide', async () => {
    // TODO: implement
  })

  it('retourne 201 à la création d un compte', async () => {
    // TODO: implement
  })
})

describe('GET /api/v1/auth/me', () => {
  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/v1/auth/me')
    expect(res.status).toBe(401)
  })
})
