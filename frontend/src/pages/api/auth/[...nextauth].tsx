import NextAuth from "next-auth"

import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";


interface UserResponseState {
    id: string,
    username: string,
    email: string,
    first_name: string,
    last_name: string
}

interface TokenResponseState {
    user: UserResponseState,
    access_token: string,
    refresh_token: string,
    ref: number,
    iat: number,
    exp: number,
    jti: string

}

interface JwtProps {
    user: UserResponseState
    token: TokenResponseState
    account: any
}


// These two values should be a bit less than actual token lifetimes
const BACKEND_ACCESS_TOKEN_LIFETIME = 45 * 60;            // 45 minutes
const BACKEND_REFRESH_TOKEN_LIFETIME = 6 * 24 * 60 * 60;  // 6 days

const getCurrentEpochTime = () => {
    return Math.floor(new Date().getTime() / 1000);
}

const SIGN_IN_HANDLERS = {
    // @ts-ignore
    "credentials": async (user, account, profile, email, credentials) => {
        return true;
    },
    // @ts-ignore
    "google": async (user, account, profile, email, credentials) => {
        try {
            const response = await axios({
                method: "post",
                url: process.env.NEXTAUTH_BACKEND_URL + "authentication/google/",
                data: {
                    access_token: account["id_token"]
                },
            });
            account["meta"] = response.data;
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

};


export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: {label: "Username", type: "text", placeholder: "Username"},
                password: {label: "Password", type: "password", placeholder: "Password"}
            },
            async authorize(credentials, req) {
                try {
                    const response = await axios({
                        url: process.env.NEXTAUTH_BACKEND_URL + 'authentication/login/',
                        method: "post",
                        data: credentials,
                    });
                    const data = response.data;
                    console.log(data)
                    if (data) return data;
                } catch (error) {
                    console.error(error);
                }
                return null;
            }
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_SECRET || '',
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        })
    ],
    callbacks: {
        // @ts-ignore
        async signIn({user, account, profile, email, credentials}) {
            const {provider} = account
            console.log(provider)
            // @ts-ignore
            if (account.provider && SIGN_IN_HANDLERS[provider]) {
                // @ts-ignore
                return SIGN_IN_HANDLERS[provider](user, account, profile, email, credentials)
            }
            return null
        },
        async jwt({user, token, account}: JwtProps) {
            // If `user` and `account` are set that means it is a login event
            if (user && account) {
                let backendResponse = account.provider === "credentials" ? user : account.meta;
                backendResponse.user.name = backendResponse.user.first_name
                token["user"] = backendResponse.user;
                token["access_token"] = backendResponse.access;
                token["refresh_token"] = backendResponse.refresh;
                token["ref"] = getCurrentEpochTime() + BACKEND_ACCESS_TOKEN_LIFETIME;
                return token;
            }
            // Refresh the backend token if necessary
            if (getCurrentEpochTime() > token["ref"]) {
                const response = await axios({
                    method: "post",
                    url: process.env.NEXTAUTH_BACKEND_URL + "auth/token/refresh/",
                    data: {
                        refresh: token["refresh_token"],
                    },
                });
                token["access_token"] = response.data.access;
                token["refresh_token"] = response.data.refresh;
                token["ref"] = getCurrentEpochTime() + BACKEND_ACCESS_TOKEN_LIFETIME;
            }
            return token;
        },
        // Since we're using Django as the backend we have to pass the JWT
        // token to the client instead of the `session`.
        async session({token}: { token: string }) {
            return token;
        },


    }
}


// @ts-ignore
export default NextAuth(authOptions)