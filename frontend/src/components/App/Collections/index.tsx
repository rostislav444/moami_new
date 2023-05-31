import Link from "next/link";
import {PL} from "@/components/Shared/Typograpy";
import * as s from './style'


interface CollectionComponentProps {
    collections: any
}

export const CollectionComponent = ({collections}: CollectionComponentProps) => {
    return (
        <s.CollectionList>
                {collections.map((collection: any) =>
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
    )
}