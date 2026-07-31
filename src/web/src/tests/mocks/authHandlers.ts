import { http, HttpResponse } from 'msw'

export const authHandlers = [
  http.get('http://localhost:5000/auth/me', () => {
    return HttpResponse.json({ user: null }, { status: 401 })
  }),

  http.get('http://localhost:5000/universities', () => {
    return HttpResponse.json({
      data: [
        { universityId: '1', name: 'University of Capetown', emailDomain: 'uct.ac.za' },
        { universityId: '2', name: 'University of Pretoria', emailDomain: 'tuks.co.za' },
      ],
    })
  }),

  http.post('http://localhost:5000/auth/register', () => {
    return HttpResponse.json({ success: true, message: 'ok' })
  }),

  http.post('http://localhost:5000/auth/verify-otp', () => {
    return HttpResponse.json({ success: true })
  }),

  http.post('http://localhost:5000/auth/login', () => {
    return HttpResponse.json({}, { status: 200 })
  }),

  http.get('http://localhost:5000/users/me', () => {
    return HttpResponse.json({
      user: {
        userId: 'user-1',
        firstName: 'Tafadzwa',
        lastName: 'M',
        email: 'tafadzwa@tuks.co.za',
        userRole: 'student',
      },
      std: {
        verificationStatus: 'pending',
        degreeProgram: 'BSc Computer Science',
        yearOfStudy: 2,
        university: 'University of Pretoria',
      },
    })
  }),

  http.get('http://localhost:5000/reviews', () => {
    return HttpResponse.json({
      reviews: [],
      buyerScore: 0,
      sellerScore: 0,
    })
  }),

  http.post('http://localhost:5000/auth/logout', () => {
    return HttpResponse.json({}, { status: 200 })
  }),
]