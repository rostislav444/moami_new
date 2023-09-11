import {OrderPage} from "@/components/App/Order";
import {GetStaticProps} from "next";
import {serverSideTranslations} from "next-i18next/serverSideTranslations";


export default function Order() {
    return <OrderPage />
}

export const getStaticProps: GetStaticProps = async ({params, locale}) => {
    return {
        props: {
            ...(await serverSideTranslations(locale || 'uk', ['common',])),
        },
    }
}
