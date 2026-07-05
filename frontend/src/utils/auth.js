import client from '../api/client'

export async function signUp({ name, email, password }) {
    try {
        const res = await client.post('/register', { name, email, password })
        const { user, token } = res.data
        localStorage.setItem('token', token)
        localStorage.setItem('current_user', JSON.stringify(user))
        return { user }
    } catch (err) {
        const msg = err.response?.data?.message
            || err.response?.data?.errors?.email?.[0]
            || 'Registration failed.'
        return { error: msg }
    }
}

export async function signIn({ email, password }) {
    try {
        const res = await client.post('/login', { email, password })
        const { user, token } = res.data
        localStorage.setItem('token', token)
        localStorage.setItem('current_user', JSON.stringify(user))
        return { user }
    } catch (err) {
        const msg = err.response?.data?.message || 'Invalid email or password.'
        return { error: msg }
    }
}

export async function signOut() {
    try {
        await client.post('/logout')
    } catch {}
    localStorage.removeItem('token')
    localStorage.removeItem('current_user')
}

export function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem('current_user')) } catch { return null }
}

export async function getMe() {
    try {
        const res = await client.get('/me')
        // keep the cached user fresh (adds address/position/branch, etc.)
        localStorage.setItem('current_user', JSON.stringify(res.data))
        return res.data
    } catch { return null }
}
