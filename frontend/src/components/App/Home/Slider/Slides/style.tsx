import styled from "@emotion/styled";
import {H1, P} from "@/components/Shared/Typograpy";
import {Button} from "@/components/Shared/Buttons";
import Link from "next/link";


interface TitleDescriptionProps {
    title: string;
    description: string;
    link_type?: string;
    link?: string;
    absolute?: boolean;
}


const TitleDescription = styled.div<{ absolute?: boolean }>`
  position: ${props => props.absolute ? 'absolute' : 'relative'};
  top: 0;
  left: 0;
  width: 65%;
  height: auto;
  // color: ${props => props.theme.color.primary};
  z-index: 3;
  
  @media(max-width: 768px) {
    width: calc(100% - 64px);
    top: 16px;
    left: 16px;
    padding: 16px;
    background-color: rgba(0,0,0,0.5);
    color: white;
  }
`

const TitleDescriptionText = styled(P)`
  max-width: 640px;
  
  @media(max-width: 768px) {
     max-width: 100%;
  }
`


const getLinkTitle = (linkType?: string) => {
    switch (linkType) {
        case 'category':
            return 'Перейти в категорию';
        case 'collection':
            return 'Перейти в коллекцию';
        case 'product':
            return 'Перейти в товар';
        case 'page':
            return 'Перейти на страницу';
        default:
            return 'Перейти';
    }
};


export const TitleDescriptionComponent = ({title, description, link, link_type, absolute}: TitleDescriptionProps) => {
    return <TitleDescription absolute={absolute} className={'title-description'} >
        {title && <H1>{title}</H1>}
        {description && <TitleDescriptionText mt={2}>{description}</TitleDescriptionText>}
        <Link href={link || '/'}>
            <Button mt={6}>{getLinkTitle(link_type)}</Button>
        </Link>
    </TitleDescription>
}