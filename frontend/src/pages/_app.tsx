import {useEffect, useRef, useState} from 'react'
import {Provider} from 'react-redux'
import '@/styles/globals.css'
import App, {AppContext, AppProps} from 'next/app'
import ThemeProvider from "@/styles/ThemeProvider";
import globalStyles from "@/styles/Global";
import {Global} from '@emotion/react';
import {setCategories} from "@/state/reducers/categories";
import {setCollections} from "@/state/reducers/collections";
import {initializeStore} from "@/state/store";
import {setSizeGrids} from "@/state/reducers/sizes";
import {setPages} from "@/state/reducers/pages";
import {API_BASE_URL} from "@/local";
import fetchWithLocale from "@/utils/fetchWrapper";
import {variantState} from "@/interfaces/catalogue";
import {setViewedProductsData} from "@/state/reducers/user";
import {SessionProvider} from "next-auth/react";
import {appWithTranslation} from 'next-i18next'
import {fetchInitialData} from "@/utils/fetchInitialData";
import {useRouter} from "next/router";


export const baseUrl = API_BASE_URL


const useStore = (initialState: any) => {
    const store = useState(() => initializeStore(initialState))[0]
    return store;
}

interface MyAppProps extends AppProps {
    initialReduxState: any,
    locale: string
}


const getDataFromLocalStorage = () => {
    if (typeof window !== 'undefined') {
        const cart: any = JSON.parse(localStorage.getItem('user.cart') || 'null')
        const viewedIds: number[] = JSON.parse(localStorage.getItem('user.viewedProductsIds') || '[]')
        return {cart, viewedIds}
    }
    return {cart: null, viewedIds: null}
}

function MyApp({Component, pageProps: {session, ...pageProps}, initialReduxState}: MyAppProps) {
    const router = useRouter();
    const {locale} = router;
    const {cart, viewedIds} = getDataFromLocalStorage()
    const preparedState = {
        ...initialReduxState,
        user: {
            ...initialReduxState.user,
            viewedProductsIds: viewedIds
        }
    }

    if (cart) {
        preparedState.cart = cart
    }

    const store = useStore(preparedState);
    const api = fetchWithLocale('uk')


    useEffect(() => {
        if (viewedIds && viewedIds.length > 0) {
            api.get('/product/variants?ids=' + viewedIds.join(','))
                .then(response => {
                    if (response.ok) {
                        const data: variantState[] = response.data;
                        const orderedVariants = viewedIds.map(id => data.find(variant => variant.id === id))
                            .filter(Boolean);
                        store.dispatch(setViewedProductsData(orderedVariants));
                    }
                });
        }
        const jssStyles = document.querySelector('#jss-server-side');
        if (jssStyles) {
            jssStyles.parentElement?.removeChild(jssStyles);
        }
    }, []);

    return (
        <SessionProvider session={session}>
            <Provider store={store}>
                <ThemeProvider>
                    <Global styles={globalStyles}/>
                    <Component key={locale} {...pageProps} />
                </ThemeProvider>
            </Provider>
        </SessionProvider>
    )
}

MyApp.getInitialProps = async (context: AppContext) => {
    const ctx = await App.getInitialProps(context);
    const {locale} = context.router;

    const _reduxStore = initializeStore(ctx.pageProps.initialReduxState || {});

    return {
        ...ctx,
        initialReduxState: _reduxStore.getState(),
        locale
    };
};

export default appWithTranslation(MyApp);
