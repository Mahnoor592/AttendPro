import client from './client'

export const getSchedules = (params) => client.get('/schedules', { params })
export const createSchedule = (data) => client.post('/schedules', data)
export const updateSchedule = (id, data) => client.put(`/schedules/${id}`, data)
export const deleteSchedule = (id) => client.delete(`/schedules/${id}`)
export const getMySchedule = () => client.get('/schedule/mine')
