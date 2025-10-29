'use server'

import { auth } from "@/lib/auth";
import { APIError } from "better-auth/api";
// import { parseSetCookieHeader } from "better-auth/cookies"; //we used this for setup cookie manualy
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
        // asResponse:true
     })

     //set cookie manually
    //  const setCookieHeader = res.headers.get('set-cookie');
    //  if(setCookieHeader){
    //     const cookie = parseSetCookieHeader(setCookieHeader);
    //     const cookieStore = await cookies();

    //     const [key, cookieAttributes] = [...cookie.entries()][0];
    //     const value = cookieAttributes.value;
    //     const maxAge = cookieAttributes['max-age'];
    //     const path = cookieAttributes.path;
    //     const httpOnly = cookieAttributes.httponly;
    //     const sameSite = cookieAttributes.samesite;

    //     cookieStore.set(key, decodeURIComponent(value), {
    //         maxAge,
    //         path,
    //         httpOnly,
    //         sameSite,
    //     })
    //  }

     return {error:null}
    } catch (error) {
      if(error instanceof APIError){
        return {error:error.message}
      }
      return {error:'Internal server error'}
    }
}