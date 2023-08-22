import {useEffect, useState}       from 'react'
import {Provider}                  from 'react-redux'
import '@/styles/globals.css'
import App, {AppContext, AppProps} from 'next/app'
import ThemeProvider               from "@/styles/ThemeProvider";
import globalStyles                from "@/styles/Global";
import {Global}                    from '@emotion/react';
import Layout                      from '@/components/Shared/Layout'
import {setCategories}             from "@/state/reducers/categories";
import {setCollections}            from "@/state/reducers/collections";
import {initializeStore}           from "@/state/store";
import {setSizeGrids}              from "@/state/reducers/sizes";
import {setPages}                  from "@/state/reducers/pages";
import {API_BASE_URL}              from "@/local";


const useStore = (initialState: any) => {
    const store = useState(() => initializeStore(initialState))[0]
    return store;
}

export const baseUrl = API_BASE_URL

interface MyAppProps extends AppProps {
    initialReduxState: any
}

function MyApp({Component, pageProps, initialReduxState}: MyAppProps) {
    const store = useStore(initialReduxState);

    useEffect(() => {
        const jssStyles = document.querySelector('#jss-server-side');
        if (jssStyles) {
            jssStyles.parentElement?.removeChild(jssStyles);
        }
    }, []);

    return (
        <Provider store={store}>
            <ThemeProvider>
                <Global styles={globalStyles}/>
                <Component {...pageProps} />
            </ThemeProvider>
        </Provider>
    )
}

MyApp.getInitialProps = async (context: AppContext) => {
    const ctx = await App.getInitialProps(context);

    const getHeaders = (context: AppContext) => {
        const {locale} = context.router;
        const isLocale = locale || 'uk'
        return {
            'Accept-Language': isLocale,
            'Content-Type': 'application/json',
        }
    }

    const fetchInitialData = async (context: AppContext) => {
        const headers = getHeaders(context);

        const urls = [
            '/category/categories/',
            '/category/collections/',
            '/sizes/size-grids/',
            '/pages/pages/'
        ];

        const [categories, collections, sizeGrids, pages] = await Promise.all(
            urls.map(url =>
                fetch(baseUrl + url, {headers}).then(res => res.json())
            )
        );

        return {categories, collections, sizeGrids, pages};
    }

    const _reduxStore = initializeStore(ctx.pageProps.initialReduxState || {});

    // only fetch initial data when the store is first created (on server side or client side first load)
    if (typeof window === 'undefined' || !ctx.pageProps.initialReduxState) {
        const {dispatch} = _reduxStore;
        const {categories, collections, sizeGrids, pages} = await fetchInitialData(context);

        dispatch(setCategories(categories));
        dispatch(setCollections(collections));
        dispatch(setSizeGrids(sizeGrids));
        dispatch(setPages(pages));
    }

    return {
        ...ctx,
        initialReduxState: _reduxStore.getState(),
    };
};

export default MyApp;
