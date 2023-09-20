import React, {useEffect, useState} from "react";
import {
    CommentBlock,
    CommentHeader,
    CommentsList,
    CommentWrapper,
    StarsBlock,
    Wrapper
} from "@/components/App/Product/Comments/style";
import {Modal} from "@/components/Shared/UI/Modal";
import {CommentForm} from "@/components/App/Product/Comments/CommentForm";
import {useSession} from "next-auth/react";
import fetchWrapper from "@/utils/fetchWrapper";
import {Caption, P} from "@/components/Shared/Typograpy";
import {Button} from "@/components/Shared/Buttons";
import {AuthenticationForm} from "@/components/Shared/Authentication/Form";

export interface Comment {
    id: number
    user: {
        first_name: string
        last_name: string
        email: string
    }
    comment: string
    images: string[]
    created_at: string
    rate: number
}


interface CommentsProps {
    productId: number
}


export const Comments = ({productId}: CommentsProps) => {
    const [comments, setComments] = useState<Comment[]>([])
    const {data: session} = useSession();
    const [formActive, setFormActive] = useState(false)

    const api = fetchWrapper();

    useEffect(() => {
        api.get(`/product/comment/?product_id=${productId}`).then((res) => {
            setComments(res.data)
        })

    }, [productId])

    return <>
        <Wrapper>
            <Button light onClick={() => setFormActive(!formActive)}>Оставить комментарий</Button>
            <CommentsList>
                {comments.map((comment) => {
                    return <CommentWrapper key={comment.id}>
                        <CommentBlock>
                            <CommentHeader>
                                <P bold>{comment.user?.first_name}</P>
                                <Caption>{comment.created_at}</Caption>
                            </CommentHeader>
                            <StarsBlock rating={comment.rate}>
                                <img src={'/icons/star.png'} alt=""/>
                                <img src={'/icons/star.png'} alt=""/>
                                <img src={'/icons/star.png'} alt=""/>
                                <img src={'/icons/star.png'} alt=""/>
                                <img src={'/icons/star.png'} alt=""/>
                            </StarsBlock>
                            <P>{comment.comment}</P>
                            {/*<div>*/}
                            {/*    {comment.images.map((image) => {*/}
                            {/*        return <img key={image} src={image} alt=""/>*/}
                            {/*    })}*/}
                            {/*</div>*/}
                        </CommentBlock>
                    </CommentWrapper>
                })}
            </CommentsList>
        </Wrapper>
        <Modal title={'Оставить комментарий'} isOpen={formActive} onClose={() => setFormActive(false)}>
            {session ? <CommentForm productId={productId} comments={comments} setComments={setComments}
                                    setFormActive={setFormActive}/> :
                <AuthenticationForm />}
        </Modal>
    </>
}