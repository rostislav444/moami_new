import {ReactNode, useEffect} from 'react';
import {Provider, useStore} from 'react-redux';
import {setCategories} from '@/state/reducers/categories';

interface GlobalDataProviderProps {
    children: ReactNode;
}

const GlobalDataProvider = ({children}: GlobalDataProviderProps) => {
    const store = useStore();


    return <Provider store={store}>{children}</Provider>;
};

export default GlobalDataProvider;
