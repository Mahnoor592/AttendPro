import client from './client'

export const getBranches    = ()           => client.get('/branches')
export const createBranch   = (data)       => client.post('/branches', data)
export const updateBranch   = (id, data)   => client.put(`/branches/${id}`, data)
export const updateBranchImage = (id, image) => client.put(`/branches/${id}/image`, { image })
export const deleteBranch   = (id)         => client.delete(`/branches/${id}`)
