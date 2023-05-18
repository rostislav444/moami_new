import {useIsMobile} from "@/components/Shared/Header/hooks";
import {DesktopHeader} from "@/components/Shared/Header/DesktopHeader";
import {MobileHeader} from "@/components/Shared/Header/MobileHeader";


export const Header = () => {
    const isMobile = useIsMobile();

    return isMobile ? <MobileHeader/> : <DesktopHeader/>
}