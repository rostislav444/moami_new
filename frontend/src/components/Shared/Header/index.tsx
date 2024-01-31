import {useIsMobile} from "@/components/Shared/Header/hooks";
import {DesktopHeader} from "@/components/Shared/Header/DesktopHeader";
import {MobileHeader} from "@/components/Shared/Header/MobileHeader";
import {useStore} from "react-redux";
import {selectCategories} from "@/state/reducers/categories";


interface HeaderProps {
    data: any
}

export const Header = () => {
    const isMobile = useIsMobile();
    const store = useStore();

    const data = {
        categories: selectCategories(store.getState()),
    }

    return isMobile ? <MobileHeader data={data} /> : <DesktopHeader data={data}/>
}