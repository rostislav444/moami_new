import axios from 'axios';
import { API_BASE_URL } from "@/local";


interface FetchResponse {
    ok: boolean;
    status: number;
    data: any | null;
}

export interface FetchWrapper {
    get: (url: string) => Promise<FetchResponse>;
    post: (url: string, body: any) => Promise<FetchResponse>;
    put: (url: string, body: any) => Promise<FetchResponse>;
    delete: (url: string) => Promise<FetchResponse>;
}

interface FetchWithLocale {
    locale?: string;
    token?: string;
}


const fetchWithLocale = (locale: string | undefined = undefined, token: string | undefined = undefined): FetchWrapper => {
    const baseUrl = API_BASE_URL;

    const request = async (url: string, method: 'get' | 'post' | 'put' | 'delete', body?: any): Promise<FetchResponse> => {
        if (!url.startsWith('/')) {
            url = '/' + url;
        }

        const headers = {
            'Content-Type': 'application/json',
            'Accept-Language': locale || 'uk',
            'Authorization': token ? `Bearer ${token}` : undefined,
        };

        try {
            const response = await axios({
                url: baseUrl + url,
                method,
                headers,
                data: body,
            });

            return {
                ok: response.status >= 200 && response.status < 300,
                status: response.status,
                data: response.data,
            };
        } catch (error: any) {
            console.error(error);
            return {
                ok: false,
                status: error?.response?.status || 500,
                data: error?.response?.data || null,
            };
        }
    };

    const get = (url: string): Promise<FetchResponse> => request(url, 'get');
    const post = (url: string, body: any): Promise<FetchResponse> => request(url, 'post', body);
    const put = (url: string, body: any): Promise<FetchResponse> => request(url, 'put', body);
    const del = (url: string): Promise<FetchResponse> => request(url, 'delete');

    return { get, post, put, delete: del };
};

export default fetchWithLocale;
