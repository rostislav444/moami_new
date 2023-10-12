import {ProductsList} from "@/components/App/Catalogue/VarinatList";
import {CatalogueProps} from "@/interfaces/catalogue";

import {useState} from "react";
import {Pagination} from "@/components/App/Catalogue/Pagination";
import {perPage} from "@/pages/[...params]";


export const Catalogue = ({initialVariants, count, url, page}: CatalogueProps) => {
    const [variants, setVariants] = useState(initialVariants);
    const [showMore, setShowMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const totalPages = Math.ceil(count / perPage);

    return (
        <div>
            <ProductsList variants={variants} preloader={!showMore && loading}/>
            {totalPages > 1 && <Pagination url={url} page={page} totalPages={totalPages}/>}
        </div>
    );
};
