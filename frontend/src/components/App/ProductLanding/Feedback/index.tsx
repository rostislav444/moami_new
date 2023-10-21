import {
    FeedbackItem,
    FeedbackItemInfo,
    FeedbackOuterWrapper,
    FeedbackWrapper
} from "@/components/App/ProductLanding/Feedback/style";

import {H1, H2, H3, Caption, P} from "@/components/Shared/Typograpy";
import {Button} from "@/components/Shared/Buttons";

interface FeedbackType {
    name: string;
    date: string;
    text: string;
}


export const Feedback = () => {
    const feedback: FeedbackType[] = [
        {
            name: 'Ирина',
            date: '09.08.2023',
            text: 'Очень понравилась жилетка. Легкая, теплая, качественная. Спасибо!'
        },
        {
            name: 'Светлана',
            date: '02.03.2023',
            text: 'Носила во время беременности. Очень удобно, не стесняет движения. Спасибо!'
        },
        {
            name: 'Анна',
            date: '09.08.2023',
            text: 'Очень понравилась жилетка. Легкая, теплая, качественная. Спасибо!'
        },
        {
            name: 'Ирина',
            date: '09.08.2023',
            text: 'Очень понравилась жилетка. Легкая, теплая, качественная. Спасибо!'
        }
    ]


    return <FeedbackOuterWrapper>
        <H1 center mt={4} mb={4}>Отзывы</H1>
        <FeedbackWrapper>
            {feedback.map((feedback, index) => (
                <FeedbackItem key={index}>
                    <FeedbackItemInfo>
                        <div>
                            <P bold>{feedback.name}</P>
                        </div>
                        <div>
                            <Caption grey>{feedback.date}</Caption>
                        </div>
                    </FeedbackItemInfo>
                    <H3>{feedback.text}</H3>
                </FeedbackItem>
            ))}
        </FeedbackWrapper>
        <Button mt={2} center>Оставить отзыв</Button>
    </FeedbackOuterWrapper>
}