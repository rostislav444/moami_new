import React, {createContext, useContext, ReactNode} from "react";

export const BASE_URL = "http://0.0.0.0:8000";

const jsonHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
};

interface ApiContextType {
    apiFetch: {
        get: (url: string, options?: Record<string, any>) => Promise<any>;
        post: (url: string, data: any, options?: Record<string, any>) => Promise<any>;
        put: (url: string, data: any, options?: Record<string, any>) => Promise<any>;
        patch: (url: string, data: any, options?: Record<string, any>) => Promise<any>;
        delete: (url: string, options?: Record<string, any>) => Promise<any>;
    }
}

export const ApiContext = createContext<ApiContextType>({
    apiFetch: {
        get: () => Promise.resolve(),
        post: () => Promise.resolve(),
        put: () => Promise.resolve(),
        patch: () => Promise.resolve(),
        delete: () => Promise.resolve()
    }
});

export const ApiProvider = ({children}: { children: ReactNode }) => {
    // Add method cors
    const apiFetch = async (url: string, method: string, data?: any, options?: Record<string, any>) => {
        console.log(`${BASE_URL}${url}`)
        const response = await fetch(`${BASE_URL}${url}`, {
            ...options,
            method,
            headers: {
                ...jsonHeaders,
            },
            body: data && JSON.stringify(data),
            mode: "cors",
        });

        if (!response.ok) {
            throw {url, status: response.status, message: response.statusText};
        }

        return response.json();
    };

    const apiFetchMethods = {
        get: (url: string, options?: Record<string, any>) => apiFetch(url, 'GET', undefined, options),
        post: (url: string, data: any, options?: Record<string, any>) => apiFetch(url, 'POST', data, options),
        put: (url: string, data: any, options?: Record<string, any>) => apiFetch(url, 'PUT', data, options),
        patch: (url: string, data: any, options?: Record<string, any>) => apiFetch(url, 'PATCH', data, options),
        delete: (url: string, options?: Record<string, any>) => apiFetch(url, 'DELETE', undefined, options),
    }

    return <ApiContext.Provider value={{apiFetch: apiFetchMethods}}>{children}</ApiContext.Provider>;
};

export const useApi = () => useContext(ApiContext);
