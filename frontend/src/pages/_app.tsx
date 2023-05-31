import {useEffect} from 'react'
import {Provider} from 'react-redux'
import store from '@/state/store'
import '@/styles/globals.css'
import {fetchCategories} from '@/state/actions/categories'
import {fetchCollections} from "@/state/actions/collections";
import ThemeProvider from "@/styles/ThemeProvider";
import globalStyles from "@/styles/Global";
import {LocaleProvider} from '@/context/localeFetchWrapper';
import {Global} from '@emotion/react';
import type {AppProps} from 'next/app'
import {ApiProvider} from "@/context/api";
import {fetchSizeGrids} from "@/state/actions/sizeGrids";
import {useRouter} from "next/router";



function App({Component, pageProps}: AppProps) {
    const router = useRouter();
    const {locale} = router;

    useEffect(() => {
        const jssStyles = document.querySelector('#jss-server-side');
        if (jssStyles) {
            jssStyles.parentElement?.removeChild(jssStyles);
        }

        async function load() {
            if (typeof window !== 'undefined') {
                !store.getState().categories.categories.length && await store.dispatch(fetchCategories());
                !store.getState().collections.collections.length && await store.dispatch(fetchCollections());
                !store.getState().sizes.sizeGrids.length && await store.dispatch(fetchSizeGrids());
            }
        }

        load();
    }, [locale]);

    return <Provider store={store}>
        <LocaleProvider>
            {/*<ApiProvider>*/}
                <ThemeProvider>
                    <Global styles={globalStyles}/>
                    <Component {...pageProps} />
                </ThemeProvider>
            {/*</ApiProvider>*/}
        </LocaleProvider>
    </Provider>
}


export default App;