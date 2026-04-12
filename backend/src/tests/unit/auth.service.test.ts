import { authService } from '../../services/auth.service'

jest.mock('../../db/config', () => ({
  pool: { execute: jest.fn() },
}))

describe('authService', () => {
  describe('login', () => {
    it('should throw if user not found', async () => {
      // TODO: implement test
    })

    it('should throw if password is incorrect', async () => {
      // TODO: implement test
    })

    it('should return tokens on valid credentials', async () => {
      // TODO: implement test
    })
  })

  describe('register', () => {
    it('should throw if email already exists', async () => {
      // TODO: implement test
    })

    it('should hash password with bcryptjs', async () => {
      // TODO: implement test
    })
  })
})
