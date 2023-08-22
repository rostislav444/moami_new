import Layout           from '@/components/Shared/Layout'
import {HomeSlider}     from "@/components/App/Home/Slider";
import 'keen-slider/keen-slider.min.css'
import {BaseProps}      from "@/interfaces/_base";
import {GetStaticProps} from "next";
import fetchWithLocale  from "@/utils/fetchWrapper";
import {HomeSlideState} from "@/interfaces/home/silder";

interface HomeProps extends BaseProps {
    slides: HomeSlideState[];
}

export default function Home({slides}: HomeProps) {
    return (
        <Layout>
            <HomeSlider slides={slides}/>
        </Layout>
    )
}

export const getStaticProps: GetStaticProps = async ({params, locale}) => {
    const api = fetchWithLocale(locale)
    const response = await api.get('/pages/home-slider')

    return {
        props: {
            slides: response.ok ? response.data : []
        }
    }
}


