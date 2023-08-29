import {useDispatch, useSelector} from "react-redux";
import {selectUserViewedProductsData, selectUserViewedProductsIds, setViewedProductsData, clearViewedProducts} from "@/state/reducers/user";
import {ViewedProductsList} from "@/components/Shared/ViewedProducts/style";
import {H2} from "@/components/Shared/Typograpy";
import {useEffect, useState} from "react";
import fetchWithLocale from "@/utils/fetchWrapper";
import {Variant} from "@/components/App/Catalogue/VarinatList/Variant";
import {variantState} from "@/interfaces/catalogue";

export const ViewedProducts = () => {


    const viewedData = useSelector(selectUserViewedProductsData);


    return viewedData.length > 0 ? <div>
        <H2 mt={12} mb={8}>Вы смотрели ({viewedData.length})</H2>
        <ViewedProductsList>
            {viewedData.map(variant => <Variant variant={variant} key={variant.id}/>)}
        </ViewedProductsList>
    </div> : null;
}
