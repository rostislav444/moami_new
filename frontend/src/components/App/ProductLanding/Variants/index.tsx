import {VariantImageWrapper, VariantItem, VariantsWrapper} from "@/components/App/ProductLanding/Variants/styled";
import {H2} from "@/components/Shared/Typograpy";
import {useRouter} from "next/router";
import NextLink from "next/link";

type VariantsProps = {
    variants: any
}

export const Variants = ({variants}: VariantsProps) => {
    // param from router
    const {slug} = useRouter().query

    return <div>
        <H2 center mt={4}>Выберите цвет</H2>
        <VariantsWrapper>
            {variants.map((variant: any, index: number) => (
                <VariantItem key={index}>
                    <NextLink href={'/lp-' + variant.slug} >
                        <VariantImageWrapper selected={slug === variant.slug}>
                            <img src={variant.image} alt={variant.code}/>
                        </VariantImageWrapper>
                        <span>{variant.color.name}</span>
                    </NextLink>
                </VariantItem>
            ))}
        </VariantsWrapper>
    </div>
}