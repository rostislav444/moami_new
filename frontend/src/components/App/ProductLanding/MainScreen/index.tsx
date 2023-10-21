import Image from 'next/image'
import {TitleWrapper} from "@/components/App/ProductLanding/style";
import {H1} from "@/components/Shared/Typograpy";


interface MainScreenProps {
    title: string;
    photo: string;
    onClick: () => void;
}

export const MainScreen = ({title, photo, onClick}: MainScreenProps) => {
    return <div>
        <TitleWrapper>
            <H1 center>{title}</H1>
        </TitleWrapper>
        <Image src={photo} alt={title} width={480} height={480}/>
    </div>
}
