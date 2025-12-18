import {create} from 'zustand';
import {toast} from 'sonner';
import { authService } from '@/services/authService';
import type { User } from '@/types/user';
import type { AuthState } from '@/types/store';

export const useAuthStore = create<AuthState>((set,get) => ({
    accessToken: null,
    user: null,
    loading: false,

    signUp : async (username, password, firstName, lastName, email) => {
        try{
            set({loading: true});
            //call API to sign up
            await authService.signUp(username, password, firstName, lastName, email);
            toast.success('Signed up successfully! Please log in.');
        }catch(error){
            console.error(error);
            toast.error('Error signing up');
        }finally{
            set({loading: false});
        }
    },
       
}));