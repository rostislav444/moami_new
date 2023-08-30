import {useSelector} from "react-redux";
import {selectUserViewedProductsData} from "@/state/reducers/user";
import {ViewedProductsList} from "@/components/Shared/ViewedProducts/style";
import {H2} from "@/components/Shared/Typograpy";
import {Variant} from "@/components/App/Catalogue/VarinatList/Variant";
import {useRouter} from "next/router";

export const ViewedProducts = () => {
    const viewedData = useSelector(selectUserViewedProductsData);
    const router = useRouter();
    const {asPath} = router;
    if (viewedData.length === 0 || asPath.startsWith('/cart') || asPath.startsWith('/order')) return null;

    return <div>
        <H2 mt={12} mb={8}>Вы смотрели ({viewedData.length})</H2>
        <ViewedProductsList>
            {viewedData.map(variant => <Variant variant={variant} key={variant.id}/>)}
        </ViewedProductsList>
    </div>
}
