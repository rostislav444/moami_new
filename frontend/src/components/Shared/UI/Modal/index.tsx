import {useEffect, useRef, useState} from "react";
import ReactDOM from 'react-dom';
import {ModalContent, ModalHeader, ModalOuter, ModalWrapper} from "@/components/Shared/UI/Modal/style";

interface PopUpProps {
    children: any,
    title?: string,
    isOpen: boolean,
    onClose: any
}


export const Modal = ({children, title, isOpen, onClose}: PopUpProps) => {
    const ref = useRef<Element | null>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        ref.current = document.querySelector<HTMLElement>("#portal")
        setMounted(true)
    }, [])

    if (!isOpen) {
        return null;
    }

    const handleOuterClick = (e: any) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    return (mounted && ref.current) ? ReactDOM.createPortal(
        <ModalOuter onClick={handleOuterClick}>
            <ModalWrapper>
                <ModalHeader title={title} onClose={onClose}/>
                <ModalContent>
                    {children}
                </ModalContent>
            </ModalWrapper>
        </ModalOuter>
        , ref.current) : null
}

