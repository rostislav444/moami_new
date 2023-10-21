import {ComparisonItem, ComparisonItemInfo, ComparisonList} from "@/components/App/ProductLanding/Compsrison/style";
import {H1, H2, P} from "@/components/Shared/Typograpy";


export const Comparison = () => {
    const data = [
        {
            title: 'Наполнитель',
            description: 'Обычные жилетки могут использовать синтетические материалы, которые могут быть менее эффективными в удержании тепла.',
        },
        {
            title: 'Вес',
            description: 'Ваша жилетка, благодаря пуху и перу, скорее всего, легче многих синтетических аналогов.',
        },
        {
            title: 'Долговечность',
            description: 'Пух и перо - натуральные материалы, которые при правильном уходе могут сохранять свои свойства дольше, чем искусственные.',
        },
        {
            title: 'Комфорт',
            description: 'Мягкая ткань и натуральные материалы создают приятное ощущение на коже, в отличие от некоторых синтетических тканей.',
        },
        {
            title: 'Экологичность',
            description: 'Натуральные материалы могут быть более экологичными по сравнению с искусственными.',
        },
        {
            title: 'Цена',
            description: 'Жилетки с натуральным наполнителем могут быть дороже, но они обеспечивают лучшее соотношение цена-качество благодаря своей долговечности и качеству.'
        }
    ]


    return (
        <div>
            <H1 center mb={8}>Сравнение с обычной жилеткой</H1>
            <ComparisonList>
                {data.map((item, index) => (
                    <ComparisonItem key={index}>
                        <H1 primary mt={-1}>{index + 1}.</H1>
                        <ComparisonItemInfo>
                            <H2>{item.title}</H2>
                            <P>{item.description}</P>
                        </ComparisonItemInfo>
                    </ComparisonItem>
                ))}
            </ComparisonList>
        </div>
    )
}