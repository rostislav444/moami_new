import React, {createContext, Dispatch, useContext, useEffect} from 'react';
import {getInitialState, selectLanguage, updateLanguage} from '@/state/reducers/language';
import {LanguageState} from '@/interfaces/language';
import {useAppSelector} from "@/state/hooks";
import store from "@/state/store";
import {useRouter} from "next/router";
import {setCookie} from "cookies-next";


interface LanguageContextProps {
    language: LanguageState['language'];
    setLanguage: Dispatch<string>;
}

const LanguageContext = createContext<LanguageContextProps>({
    language: getInitialState().language,
    setLanguage: () => {
    },
});

export const useLanguage = () => useContext(LanguageContext);

interface LanguageProviderProps {
    children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({children}) => {
    const router = useRouter();
    const {language} = useAppSelector(selectLanguage);
    const isMounted = React.useRef(false);

    useEffect(() => {
        if (isMounted.current === true) {
            setCookie('language', language)
            router.replace(router.asPath)
        } else {
            isMounted.current = true;
        }
    }, [language])


    const setLanguage = (newLanguage: string) => {
        setCookie('language', newLanguage)
        store.dispatch(updateLanguage(newLanguage));

    };

    const value = {language, setLanguage};

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
