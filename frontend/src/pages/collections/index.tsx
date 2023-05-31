import Layout from "@/components/Shared/Layout";
import {useAppSelector} from "@/state/hooks";
import {selectCollections} from "@/state/reducers/collections";
import {CollectionComponent} from "@/components/App/Collections";

export default function Collections() {
    const {collections} = useAppSelector(selectCollections)

    const breadcrumbs = [
        {title: 'Главная', link: '/'},
        {title: 'Коллекции', link: '/collections'},
    ]

    return (
        <Layout breadcrumbs={breadcrumbs}>
            <CollectionComponent collections={collections}/>
        </Layout>
    )
}
