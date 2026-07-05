import client from './client'

export const getShiftRequests = (params) => client.get('/shift-requests', { params })
export const createShiftRequest = (data) => client.post('/shift-requests', data)
export const getMyShiftRequests = () => client.get('/shift-requests/mine')
export const decideShiftRequest = (id, data) => client.put(`/shift-requests/${id}`, data)
