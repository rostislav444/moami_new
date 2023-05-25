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
import {updateLanguage} from "@/state/reducers/language";
import {LanguageProvider} from "@/context/language";


store.dispatch(fetchCategories());
store.dispatch(fetchCollections());
store.dispatch(fetchSizeGrids());


function App({Component, pageProps}: AppProps) {
    useEffect(() => {
        const jssStyles = document.querySelector('#jss-server-side');

        if (jssStyles) {
            console.log('jss')
            jssStyles.parentElement?.removeChild(jssStyles);
        }

        if (typeof window !== 'undefined') {
            const session_id = localStorage.getItem('session-id');
            if (session_id === 'null' || session_id === null) {
                const randomSessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                localStorage.setItem('session-id', randomSessionId);

            }
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


App.getStaticProps = async ({Component, ctx}: AppContext) => {
    console.log('getStaticProps')

    const language = getCookie('language', ctx) as string;
    if (language !== undefined && language !== null) {
        store.dispatch(updateLanguage(language))
    }

    return {};
}


App.getServerSideProps = async ({Component, ctx}: AppContext) => {
    !store.getState().categories.categories.length && await store.dispatch(fetchCategories());
    !store.getState().sizes.sizeGrids.length && await store.dispatch(fetchSizeGrids());

    const categories = store.getState().categories.categories;
    const sizes = store.getState().sizes;

    return {categories, sizes};
};


export default App;