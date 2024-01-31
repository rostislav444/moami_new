import Layout from '@/components/Shared/Layout'
import 'keen-slider/keen-slider.min.css'
import {BaseProps} from "@/interfaces/_base";
import {HomeSlideState} from "@/interfaces/home/silder";
import {HomeCategories} from "@/components/App/Home/Categories";
import {serverSideTranslations} from 'next-i18next/serverSideTranslations'
import {GetStaticProps} from "next";
import {wrapper} from '@/state/store'
import {fetchInitialData} from "@/utils/fetchInitialData";
import {setCategories} from "@/state/reducers/categories";
import {setCollections} from "@/state/reducers/collections";
import {setSizeGrids} from "@/state/reducers/sizes";
import {setPages} from "@/state/reducers/pages";

interface HomeProps extends BaseProps {
    slides: HomeSlideState[];
}

export default function Home({slides}: HomeProps) {

    return (
        <Layout>
            <HomeCategories/>
        </Layout>
    )
}


export const getStaticProps: GetStaticProps = wrapper.getStaticProps(store => async ({params, locale}) => {
    const {categories, collections, sizeGrids, pages} = await fetchInitialData(locale || 'uk');
    store.dispatch(setCategories(categories));
    // store.dispatch(setCollections(collections));
    // store.dispatch(setSizeGrids(sizeGrids));
    // store.dispatch(setPages(pages));

    // Ваш остальной код для getStaticProps
    const additionalProps = {
        ...(await serverSideTranslations(locale || 'uk', ['common'])),
    };

    return {
        props: additionalProps,
    };
});


