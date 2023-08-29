import Layout from '@/components/Shared/Layout'
import 'keen-slider/keen-slider.min.css'
import {BaseProps} from "@/interfaces/_base";
import {GetStaticProps} from "next";
import fetchWithLocale from "@/utils/fetchWrapper";
import {HomeSlideState} from "@/interfaces/home/silder";
import {HomeCategories} from "@/components/App/Home/Categories";

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

