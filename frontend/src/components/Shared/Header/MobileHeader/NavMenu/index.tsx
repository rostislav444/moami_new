import * as s from "@/components/Shared/Header/MobileHeader/NavMenu/style";
import {MobileMenuPopupCategories} from "@/components/Shared/Header/MobileHeader/NavMenu/Categories";
import {P} from "@/components/Shared/Typograpy";
import {Phone} from "@/components/Shared/Header/components/Phone";


interface Props {
    toggleMenu: (e: React.SyntheticEvent) => void;
    data: any
}


export const MobileMenuPopup = ({toggleMenu, data}: Props) => {
    return <s.Wrapper>
        <Phone />
        <MobileMenuPopupCategories toggleMenu={toggleMenu} data={data} />
    </s.Wrapper>
}