import {BenefitImageWrapper, BenefitItem, BenefitsList} from "@/components/App/ProductLanding/Benefits/style";
import {H1, H2, P} from "@/components/Shared/Typograpy";


export const Benefits = () => {
    const benefits = [{
            title: 'Мягкая ткань',
            description: 'Создает комфортное ощущение при носке и подходит для чувствительной кожи',
            image: 'http://localhost:3000/_next/image?url=http%3A%2F%2F0.0.0.0%3A8000%2Fmedia%2Fproduct%2Fvariantimage%2F391%2Fnn-315-1692965616876943.jpg&w=3840&q=90'
        },
        {
            title: 'Комбинация наполнителя',
            description: '10% пуха и 90% пера гарантируют тепло и легкость изделия',
            image: 'http://localhost:3000/_next/image?url=http%3A%2F%2F0.0.0.0%3A8000%2Fmedia%2Fproduct%2Fvariantimage%2F391%2Fnn-315-1692965616876943.jpg&w=3840&q=90'
        },
        {
            title: 'Эффективная теплоизоляция',
            description: 'Пух и перо хорошо удерживают тепло, обеспечивая отличную защиту от холода',
            image: 'http://localhost:3000/_next/image?url=http%3A%2F%2F0.0.0.0%3A8000%2Fmedia%2Fproduct%2Fvariantimage%2F391%2Fnn-315-1692965616876943.jpg&w=3840&q=90'
        },
        {
            title: 'Воздухопроницаемость',
            description: 'Ткань дышит, предотвращая чрезмерное потоотделение',
            image: 'http://localhost:3000/_next/image?url=http%3A%2F%2F0.0.0.0%3A8000%2Fmedia%2Fproduct%2Fvariantimage%2F391%2Fnn-315-1692965616876943.jpg&w=3840&q=90'
        },
        {
            title: 'Стильный дизайн',
            description: 'Современный и модный внешний вид',
            image: 'http://localhost:3000/_next/image?url=http%3A%2F%2F0.0.0.0%3A8000%2Fmedia%2Fproduct%2Fvariantimage%2F391%2Fnn-315-1692965616876943.jpg&w=3840&q=90'
        },
        {
            title: 'Легкая структура',
            description: 'Жилетка не сковывает движений и не ощущается тяжелой на теле',
            image: 'http://localhost:3000/_next/image?url=http%3A%2F%2F0.0.0.0%3A8000%2Fmedia%2Fproduct%2Fvariantimage%2F391%2Fnn-315-1692965616876943.jpg&w=3840&q=90'
        }

    ]

    return <div>
        <H1 center mt={4} mb={4}>Почему стоит купить жилетку?</H1>
        <BenefitsList>
            {benefits.map((benefit, index) => (
                <BenefitItem key={index}>
                    <div>
                        <BenefitImageWrapper>
                            <img src={benefit.image} alt={benefit.title}/>
                        </BenefitImageWrapper>
                    </div>
                    <div>
                        <H2 mb={2} primary bold>{benefit.title}</H2>
                        <P>{benefit.description}</P>
                    </div>
                </BenefitItem>
            ))}
        </BenefitsList>
    </div>

}