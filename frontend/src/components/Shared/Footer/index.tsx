import {FooterWrapper, MainLine, PagesBlock, PagesBlockList, SloganBlock,} from "@/components/Shared/Footer/style";
import {Content} from "@/styles/Blocks/Content";
import {H3, P} from "@/components/Shared/Typograpy";
import React from "react";
import {useAppSelector} from "@/state/hooks";
import {selectPages} from "@/state/reducers/pages";


export const Footer = () => {
    const {pages} = useAppSelector(selectPages)

    return <FooterWrapper>
        <Content>
            <MainLine>
                <SloganBlock>
                    <H3 color='white'>Moami - искусство быть Собой</H3>
                    <P mt={2}>В Moami, мы ценим индивидуальность каждой женщины. Наша тщательно подобранная коллекция
                        представляет из себя симбиоз высокого качества и элегантного дизайна, способного подчеркнуть
                        вашу уникальную сущность. С Moami вы найдете гармонию стиля, которая отражает вас. Добро
                        пожаловать в мир изысканной моды.</P>
                </SloganBlock>
                <PagesBlock>
                    <div>
                        <H3 mb={2}>Покупателю</H3>
                        <PagesBlockList>
                            {pages.map((page, index) => <li key={index}>
                                <a color='white'>{page.name}</a>
                            </li>)}

                            <li>
                                <a color='white'>Коллекции</a>
                            </li>
                        </PagesBlockList>
                    </div>
                    <div>
                        <H3 mb={2}>Мы в социальных сетях</H3>
                        <PagesBlockList>
                            <li>
                                <a color='white'>instagram</a>
                            </li>
                        </PagesBlockList>
                    </div>

                </PagesBlock>
            </MainLine>
        </Content>
    </FooterWrapper>
}