import Layout from '@/components/Shared/Layout'
import 'keen-slider/keen-slider.min.css'
import {BaseProps} from "@/interfaces/_base";
import {HomeSlideState} from "@/interfaces/home/silder";
import {HomeCategories} from "@/components/App/Home/Categories";
import {useSession, signIn, signOut} from "next-auth/react";

interface HomeProps extends BaseProps {
    slides: HomeSlideState[];
}

export default function Home({slides}: HomeProps) {
    const {data: session, status} = useSession();

    console.log('session', session)


    return (
        <Layout>
            <HomeCategories/>
        </Layout>
    )
}

