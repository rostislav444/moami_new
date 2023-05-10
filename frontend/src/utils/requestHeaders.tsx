import {getCookie} from 'cookies-next';
import {GetServerSidePropsContext} from "next";

export const RequestHeaders = (context: GetServerSidePropsContext) => {
    const language = getCookie('language', context) as string;

    const headers = {
        'Content-Type': 'application/json',
        'Accept-Language': language || 'ru-ru'
    }
    return headers
}