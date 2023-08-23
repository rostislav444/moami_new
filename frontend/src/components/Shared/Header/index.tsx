import {useIsMobile} from "@/components/Shared/Header/hooks";
import {DesktopHeader} from "@/components/Shared/Header/DesktopHeader";
import {MobileHeader} from "@/components/Shared/Header/MobileHeader";
import {useStore} from "react-redux";
import {selectCategories} from "@/state/reducers/categories";
import {selectCollections} from "@/state/reducers/collections";


interface HeaderProps {
    data: any
}

export const Header = () => {
    const isMobile = useIsMobile();
    const store = useStore();

    const data = {
        categories: selectCategories(store.getState()),
        collections: selectCollections(store.getState())
    }

    return isMobile ? <MobileHeader data={data} /> : <DesktopHeader data={data}/>
}