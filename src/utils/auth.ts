import Cookies from 'js-cookie';

export const setToken = (token: string, expiresIn: number = 24 * 60 * 60) => {
    Cookies.set('access_token', token, {
        expires: expiresIn / 86400,
        secure: true,
        sameSite: 'none'
    });
};
  
export const getToken = (): string | undefined => {
    return Cookies.get('access_token');
};
  
export const removeToken = () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    Cookies.remove('token_type');
    Cookies.remove('expires_at');
};

export const setRole = (role: string) => {
    Cookies.set('user_type', role)
}

export const getRole = (): string | undefined => {
    return Cookies.get('user_type');
}