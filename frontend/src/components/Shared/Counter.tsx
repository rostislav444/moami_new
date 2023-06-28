import styled from "@emotion/styled"

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 90px;
  height: 30px;
  border: 1px solid ${props => props.theme.color.primary};
  
  @media (max-width: 768px) {
    width: auto;
    height: auto;
  }
`

const Button = styled.button`
  width: 30px;
  height: 30px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  cursor: pointer;
  font-size: 18px;
  font-weight: 500;
  color: ${props => props.theme.color.primary};

  :hover {
    background-color: ${props => props.theme.color.primary};
    color: white;
  }
`

const Value = styled.span`
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
`


interface CounterProps {
    value: number,
    onChange: (value: number) => void,
    maxValue?: number,
}


export const Counter = ({value, onChange, maxValue}: CounterProps) => {
    const handleIncrement = () => {
        if (maxValue && value >= maxValue) return;
        onChange(value + 1);
    }

    const handleDecrement = () => {
        if (value <= 1) return;
        onChange(value - 1);
    }

    return <Wrapper>
        <Button onClick={handleDecrement}>-</Button>
        <Value>{value}</Value>
        <Button onClick={handleIncrement}>+</Button>
    </Wrapper>
}