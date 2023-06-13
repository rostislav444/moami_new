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
  top: 5%;
  left: 2%;
  width: auto;
  height: auto;
  z-index: 3;
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
    return <TitleDescription absolute={absolute}>
        {title && <H1>{title}</H1>}
        {description && <P mt={2}>{description}</P>}
        <Link href={link || '/'}>
            <Button mt={6}>{getLinkTitle(link_type)}</Button>
        </Link>
    </TitleDescription>
}