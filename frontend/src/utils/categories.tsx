import {CategoryState} from "@/interfaces/categories";


export const categoriesBySlugList = (categories: CategoryState[], slugs: string[], result: any) => {
    for (let i = 0; i < categories.length; i++) {
        if (categories[i].slug === slugs[0]) {
            const link = result.length > 0 ? result[result.length - 1].link + '/' + categories[i].slug : '/' + categories[i].slug
            result.push({title: categories[i].name, link: link})
            if (slugs.length > 1) {
                categoriesBySlugList(categories[i].children, slugs.slice(1), result)
            }
        }
    }
    return result
}


export const getCategoriesAndPage = (params: string[]) => {
    let page = 1
    if (params.includes('page')) {
        page = parseInt(params[params.length - 1])
        params = params.slice(0, params.length - 2)
    }
    return {page, categories: params}
}