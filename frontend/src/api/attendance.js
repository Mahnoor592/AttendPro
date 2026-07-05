import client from './client'

export const getAttendance = (params) => client.get('/attendance', { params })
export const getMyAttendance = () => client.get('/attendance/mine')
export const getAnomalies = () => client.get('/attendance/anomalies')
export const checkIn = (data) => client.post('/attendance/checkin', data)
export const checkOut = (data) => client.post('/attendance/checkout', data)
