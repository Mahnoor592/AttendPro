import client from './client'

export const updateProfile  = (data) => client.put('/me', data)
export const updatePassword = (data) => client.put('/me/password', data)
export const deleteAccount  = ()     => client.delete('/me')
