import Layout from '@/components/Shared/Layout'
import 'keen-slider/keen-slider.min.css'
import {BaseProps} from "@/interfaces/_base";
import {HomeSlideState} from "@/interfaces/home/silder";
import {HomeCategories} from "@/components/App/Home/Categories";
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import {GetStaticProps} from "next";

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


export const getStaticProps: GetStaticProps = async ({params, locale}) => {
    return {
        props: {
            ...(await serverSideTranslations(locale || 'uk', ['common',])),
        },
    }
}
