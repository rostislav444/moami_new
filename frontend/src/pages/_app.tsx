import {useEffect} from 'react'
import {Provider} from 'react-redux'
import store from '@/state/store'
import '@/styles/globals.css'
import {fetchCategories} from '@/state/actions/categories'
import {fetchCollections} from "@/state/actions/collections";
import ThemeProvider from "@/styles/ThemeProvider";
import globalStyles from "@/styles/Global";

import {Global} from '@emotion/react';
import type {AppContext, AppProps} from 'next/app'
import {ApiProvider} from "@/context/api";
import {fetchSizeGrids} from "@/state/actions/sizeGrids";
import {getCookie} from 'cookies-next';
import language, {updateLanguage} from "@/state/reducers/language";
import {LanguageProvider} from "@/context/language";

import {cookies} from 'next/headers';


// store.dispatch(fetchCategories());
// store.dispatch(fetchCollections());
// store.dispatch(fetchSizeGrids());


function App({Component, pageProps}: AppProps) {
    useEffect(() => {
        const jssStyles = document.querySelector('#jss-server-side');
        if (jssStyles) {
            console.log('jss')
            jssStyles.parentElement?.removeChild(jssStyles);
        }
        if (typeof window !== 'undefined') {
            console.log('window')
        }
    }, []);

    return <Provider store={store}>
        <LanguageProvider>
            <ApiProvider>
                <ThemeProvider>
                    <Global styles={globalStyles}/>
                    <Component {...pageProps} />
                </ThemeProvider>
            </ApiProvider>
        </LanguageProvider>
    </Provider>
}


App.getServerSideProps = async ({Component, ctx}: AppContext) => {
    !store.getState().categories.categories.length && await store.dispatch(fetchCategories());
    !store.getState().collections.collections.length && await store.dispatch(fetchCollections());
    !store.getState().sizes.sizeGrids.length && await store.dispatch(fetchSizeGrids());

    const language = getCookie('language', ctx) as string;
    if (language !== undefined && language !== null) {
        store.dispatch(updateLanguage(language))
    }

    const categories = store.getState().categories.categories;
    const collections = store.getState().collections.collections;
    const sizes = store.getState().sizes;

    return {categories,collections, sizes };
}


export default App;