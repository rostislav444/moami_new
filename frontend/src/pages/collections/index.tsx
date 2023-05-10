import Layout from "@/components/Shared/Layout";
import {useAppSelector} from "@/state/hooks";
import {selectCollections} from "@/state/reducers/collections";
import * as s from './style'
import {PL} from "@/components/Shared/Typograpy";
import Link from "next/link";

export default function Collections() {
    const {collections} = useAppSelector(selectCollections)

    const breadcrumbs = [
        {title: 'Главная', link: '/'},
        {title: 'Коллекции', link: '/collections'},
    ]

    return (
        <Layout breadcrumbs={breadcrumbs}>
            <s.CollectionList>
                {collections.map((collection) =>
                    <s.CollectionItem key={collection.id}>
                        <s.CollectionImageWrapper>
                            <Link href={`/collections/${collection.slug}`}>
                                <s.CollectionImage src={collection.image} alt={collection.name}/>
                            </Link>
                        </s.CollectionImageWrapper>
                        <Link href={`/collections/${collection.slug}`}>
                            <PL bold mt={2}>{collection.name}</PL>
                        </Link>
                    </s.CollectionItem>
                )}
            </s.CollectionList>
        </Layout>
    )
}
