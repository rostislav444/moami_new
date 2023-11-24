import {baseUrl} from "@/pages/_app";


const getHeaders = (locale: string) => {
    return {
        'Accept-Language': locale,
        'Content-Type': 'application/json',
    }
}

export const fetchInitialData = async (locale: string, update: boolean = false) => {
    const headers = getHeaders(locale);

    const urls = [
        '/category/categories/',
        '/category/collections/',
        '/sizes/size-grids/',
        '/pages/pages/'
    ];

    const [categories, collections, sizeGrids, pages] = await Promise.all(
        urls.map(async url => {
            if (update && url === urls[2]) {
                // If update is true and the URL is for size-grids, return null
                return null;
            }

            const res = await fetch(baseUrl + url, {headers});
            return res.json();
        })
    );


    return {categories, collections, sizeGrids, pages};
}