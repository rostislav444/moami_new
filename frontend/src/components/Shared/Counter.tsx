import styled from "@emotion/styled"

const Wrapper = styled.div<{ mt?: number, mb?: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 32px;
  border: 1px solid ${props => props.theme.color.light};
  margin-top: ${props => props.mt ? props.mt * 4 : 0}px;
  margin-bottom: ${props => props.mb ? props.mb * 4 : 0}px;
  
`

const Button = styled.button`
  width: 32px;
  height: 32px;
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
  width: 36px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
`


interface CounterProps {
    value: number,
    onChange: (value: number) => void,
    maxValue?: number,
    mt?: number,
    mb?: number
}


export const Counter = ({value, onChange, maxValue, mt, mb}: CounterProps) => {
    const handleIncrement = () => {
        if (maxValue && value >= maxValue) return;
        onChange(value + 1);
    }

    const handleDecrement = () => {
        if (value <= 1) return;
        onChange(value - 1);
    }

    return <Wrapper {...{mt, mb}}>
        <Button onClick={handleDecrement}>-</Button>
        <Value>{value}</Value>
        <Button onClick={handleIncrement}>+</Button>
    </Wrapper>
}