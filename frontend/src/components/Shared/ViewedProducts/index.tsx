import {useSelector} from "react-redux";
import {selectUserViewedProductsData} from "@/state/reducers/user";
import {useRouter} from "next/router";
import {Slider} from "@/components/Shared/ViewedProducts/Slider";


export const ViewedProducts = () => {
    const viewedData = useSelector(selectUserViewedProductsData);
    const joinIds = viewedData.map(variant => variant.id).join(',');
    const router = useRouter();
    const {asPath} = router;


    if (viewedData.length === 0 || asPath.startsWith('/cart') || asPath.startsWith('/order')) return null;

    return <Slider key={joinIds} viewedData={viewedData}/>
}
