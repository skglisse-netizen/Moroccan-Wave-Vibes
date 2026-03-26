import { User } from '../types';

export const hasPermission = (user: User | null, codename: string) => {
    if (!user) return false;
    if (user.role === 'administrateur') return true;
    if (codename.endsWith('_landing_page') && user.permissions?.includes('manage_site')) return true;
    return user.permissions?.includes(codename);
};
