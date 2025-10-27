import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

export const getAuthSession = () => getServerSession(authOptions);
