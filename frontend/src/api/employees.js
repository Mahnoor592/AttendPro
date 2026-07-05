import client from './client'

export const getEmployees = (params) => client.get('/employees', { params })
export const createEmployee = (data) => client.post('/employees', data)
export const updateEmployee = (id, data) => client.put(`/employees/${id}`, data)
export const deleteEmployee = (id) => client.delete(`/employees/${id}`)
