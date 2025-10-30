'use server'

import { auth } from "@/lib/auth";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";

export const signInEmailAction = async(formdata:FormData) => {

    const email = String(formdata.get('email'));
    if(!email) return {error: 'Please enter your email'}

    const password = String(formdata.get('password'));
    if(!password) return {error:'Please enter your password'}

    try {
      await auth.api.signInEmail({
      headers:await headers(),
        body:{
            email,
            password
        },
     })

     return {error:null}
    } catch (error) {
      if(error instanceof APIError){
        return {error:error.message}
      }
      return {error:'Internal server error'}
    }
}