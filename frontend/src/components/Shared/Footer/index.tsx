import {FooterWrapper, MainLine, PagesBlock, PagesBlockList, SloganBlock,} from "@/components/Shared/Footer/style";
import {Content} from "@/styles/Blocks/Content";
import {H3, P} from "@/components/Shared/Typograpy";
import React from "react";
import {useSelector} from "react-redux";
import {RootState} from "@/state/store";
import Link from "next/link";
import {useRouter} from "next/router";
import {useTranslation} from "next-i18next";


export const Footer = () => {
    const {t} = useTranslation('common', {useSuspense: false})
    const pages = useSelector((state: RootState) => state.pages.pages)
    const router = useRouter()
    const locale = router.locale || 'ru'


    return <FooterWrapper>
        <Content>
            <MainLine>
                <SloganBlock>
                    <H3 color='white'>{t('footer.slogan.title')}</H3>
                    <P mt={2}>{t('footer.slogan.text')}</P>
                </SloganBlock>
                <PagesBlock>
                    <div>
                        <H3 mb={2}>{t('footer.titles.buyerInfo')}</H3>
                        <PagesBlockList>
                            {pages.map((page, index) => <li key={index}>
                                <Link locale={locale} href={'/info/' + page.slug}>{page.name}</Link>
                            </li>)}
                        </PagesBlockList>
                    </div>
                    <div>
                        <H3 mb={2}>{t('footer.titles.weInSocial')}</H3>
                        <PagesBlockList>
                            <li>
                                <a href={'https://www.instagram.com/moami.com.ua/'} color='white'>Instagram</a>
                            </li>
                        </PagesBlockList>
                    </div>
                </PagesBlock>
            </MainLine>
        </Content>
    </FooterWrapper>
}