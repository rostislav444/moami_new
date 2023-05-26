import {LanguageState} from "@/interfaces/language";
import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {setCookie, getCookie} from 'cookies-next';
import {cookies} from "next/headers";


export const languageOptions = [
    {
        label: 'Укр',
        value: 'uk-ua',
    },
    {
        label: 'Руc',
        value: 'ru-ru',
    },
    {
        label: 'Eng',
        value: 'en-us',
    }
]


export const getInitialState = (): LanguageState => {
    if (typeof window !== 'undefined') {
        const language = getCookie('language') as string;
        if (language !== undefined && language !== null) {
            return {
                language: language
            }
        }
    }
    return {
        language: 'uk-ua'
    }
}


const initialState: LanguageState = getInitialState();


export const languageSlice = createSlice({
    name: 'language',
    initialState,
    reducers: {
        updateLanguage: (state, action: PayloadAction<string>) => {
            state.language = action.payload
            setCookie('language', action.payload)
        }
    }
})

export const {updateLanguage} = languageSlice.actions

export const selectLanguage = (state: any) => state.language

export default languageSlice.reducer