import {createContext, useContext, useEffect, useState} from "react";
import fetchWithLocale, {FetchWrapper} from "@/utils/fetchWrapper";
import {useRouter} from "next/router";


const localeContext = createContext<FetchWrapper | null>(null);

export const useLocale = (): FetchWrapper => {
    const context = useContext(localeContext);
    if (!context) {
        throw new Error("useLocale must be used within a LocaleProvider");
    }
    return context;
};

export const LocaleProvider = ({children}: { children: React.ReactNode }) => {
    const router = useRouter();
    const {locale} = router;
    const [apiFetch, setApiFetch] = useState<FetchWrapper | null>(null);

    useEffect(() => {
        const fetchWrapper = fetchWithLocale(locale);
        setApiFetch(fetchWrapper);
    }, [locale]);

    if (!apiFetch) {
        // You can render a loading state here if needed
        return null;
    }

    return (
        <localeContext.Provider value={apiFetch}>
            {children}
        </localeContext.Provider>
    );
};

export default localeContext;