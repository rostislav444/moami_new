import {getCookie} from 'cookies-next';
import {GetServerSidePropsContext} from "next";

export const RequestHeaders = (context: GetServerSidePropsContext, language: string|null = null) => {
    if (language !== null) {
        return {
            'Content-Type': 'application/json',
            'Accept-Language': language
        }
    }

    const _language = getCookie('language', context) as string;
    const headers = {
        'Content-Type': 'application/json',
        'Accept-Language': _language || 'ru-ru'
    }
    return headers
}

