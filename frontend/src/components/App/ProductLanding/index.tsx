import {VariantPageProps} from "@/interfaces/variant";
import Layout from "@/components/Shared/LandingLayout";
import {Logo} from "@/components/Shared/Header/components/Logo";
import React, {useState} from "react";
import {MainScreen} from "@/components/App/ProductLanding/MainScreen";
import {LogoWrapper} from "@/components/App/ProductLanding/style";
import {Benefits} from "@/components/App/ProductLanding/Benefits";
import {Comparison} from "@/components/App/ProductLanding/Compsrison";
import {Gallery} from "@/components/App/ProductLanding/Galery";
import {Feedback} from "@/components/App/ProductLanding/Feedback";
import {Form} from "@/components/App/ProductLanding/Form";
import {Variants} from "@/components/App/ProductLanding/Variants";
import {Footer} from "@/components/App/ProductLanding/Footer";


export const ProductLandingPageComponent = ({variant, locale}: VariantPageProps) => {
    const [selectedVariant, setSelectedVariant] = useState(0)


    return (
        <Layout>
            <LogoWrapper>
                <Logo/>
            </LogoWrapper>
            <MainScreen title={variant.product.name} photo={variant.images[0]?.image} onClick={() => {}}/>
            <Variants  variants={variant.product.variants}/>
             <Gallery images={variant.images.map(image => image.image)}/>
            <Benefits />
            <Comparison />

            <Variants  variants={variant.product.variants}/>
            <Feedback />
            <Form />
            <Footer />
        </Layout>
    )
}