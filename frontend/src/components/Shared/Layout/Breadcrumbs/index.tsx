import {BreadcrumbsState} from '../index'
import Link from 'next/link'
import {BreadcrumbsSeparator, BreadcrumbsWrapper} from "@/components/Shared/Layout/Breadcrumbs/style";

interface BreadcrumbsProps {
    breadcrumbs?: BreadcrumbsState[];
}

export const Breadcrumbs = ({breadcrumbs}: BreadcrumbsProps) => {
    const len = breadcrumbs?.length

    return (
        <BreadcrumbsWrapper>
            {/*{breadcrumbs?.map((breadcrumb, index) =>*/}
            {/*    <li key={index}>*/}
            {/*        {!breadcrumb.link || index === breadcrumbs.length - 1 ?*/}
            {/*            <span>{breadcrumb.title}</span>*/}
            {/*            : <Link href={breadcrumb.link}>{breadcrumb.title}</Link>*/}
            {/*        }*/}
            {/*        {len && index < len - 1 && <BreadcrumbsSeparator>/</BreadcrumbsSeparator>}*/}
            {/*    </li>*/}

            {/*)}*/}
        </BreadcrumbsWrapper>
    )
}