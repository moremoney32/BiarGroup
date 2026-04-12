import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:5000/api/v1'

export const handlers = [
  http.post(`${BASE}/auth/login`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'fake-access-token',
        user: {
          id: 1, tenantId: 1, email: 'admin@biargroup.cd',
          firstName: 'Admin', lastName: 'BIAR',
          phone: '+243810000000', role: 'admin',
          isActive: true, emailVerifiedAt: null, createdAt: '2026-01-01',
        },
      },
    })
  }),

  http.post(`${BASE}/auth/logout`, () => {
    return HttpResponse.json({ success: true, data: null })
  }),

  http.get(`${BASE}/auth/me`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 1, tenantId: 1, email: 'admin@biargroup.cd',
        firstName: 'Admin', lastName: 'BIAR',
        phone: '+243810000000', role: 'admin',
        isActive: true, emailVerifiedAt: null, createdAt: '2026-01-01',
      },
    })
  }),

  http.get(`${BASE}/sms/campaigns`, () => {
    return HttpResponse.json({
      success: true,
      data: { items: [], meta: { page: 1, perPage: 20, total: 0, lastPage: 1 } },
    })
  }),
]
