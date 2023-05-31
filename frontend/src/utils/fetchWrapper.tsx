interface FetchOptions extends RequestInit {
  headers: { [key: string]: string };
}

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

const fetchWithLocale = (locale: string|undefined = undefined): FetchWrapper => {
    const baseUrl = process.env.API_BASE_URL || 'http://0.0.0.0:8000'

    const request = async (url: string, method: string, body?: any): Promise<FetchResponse> => {
        if (!url.startsWith('/')) {
            url = '/' + url;
        }

        const headers: { [key: string]: string } = {
            'Content-Type': 'application/json',
            'Accept-Language': locale || 'uk'
        };

        const options: FetchOptions = {
            method,
            headers,
            mode: 'cors',
            body: JSON.stringify(body),
        };

        try {
            const response = await fetch(baseUrl + url, options);
            const responseData = await response.json();

            return {
                ok: response.ok,
                status: response.status,
                data: response.ok ? responseData : null,
            };
        } catch (error) {
            console.error('Request error:', error);
            return {
                ok: false,
                status: 500,
                data: null,
            };
        }
    };

    const get = (url: string): Promise<FetchResponse> => request(url, 'GET');
    const post = (url: string, body: any): Promise<FetchResponse> => request(url, 'POST', body);
    const put = (url: string, body: any): Promise<FetchResponse> => request(url, 'PUT', body);
    const del = (url: string): Promise<FetchResponse> => request(url, 'DELETE');

    return {get, post, put, delete: del};
};

export default fetchWithLocale;
