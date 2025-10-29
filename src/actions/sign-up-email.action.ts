'use server'

import { auth, ErrorCode } from "@/lib/auth";
import { APIError } from "better-auth/api";

export const signUpEmailAction = async(formData:FormData) => {
    const name = String(formData.get('name'));
    if(!name) return {error: 'Please enter Your name'}
    const email = String(formData.get('email'));
    if(!email) return {error: 'Please enter Your email'}
    const password = String(formData.get('password'));
    if(!password) return {error: 'Please enter Your password'}

    try {
        await auth.api.signUpEmail({
           body:{
            name,
            email,
            password,
           } 
        })   
    return {error:null} 
    } catch (error) {
        if(error instanceof APIError){
         const errCode = error.body ? (error.body.code as ErrorCode) : 'unknown';
         switch(errCode){
            default:
                return {error: error.message}
         }
        }
        return {error:'Internal Server Error'}
    }
}