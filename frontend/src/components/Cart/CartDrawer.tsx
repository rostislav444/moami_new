import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Image,
  IconButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Divider,
  Box,
  useToast,
} from '@chakra-ui/react'
import { DeleteIcon } from '@chakra-ui/icons'
import { useStore } from '@/store'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, updateCartItem, removeFromCart, clearCart } = useStore()
  const toast = useToast()

  const handleQuantityChange = (id: number, quantity: number) => {
    if (quantity > 0) {
      updateCartItem(id, quantity)
    }
  }

  const handleRemoveItem = (id: number) => {
    removeFromCart(id)
    toast({
      title: 'Товар удален из корзины',
      status: 'success',
      duration: 2000,
      isClosable: true,
    })
  }

  const handleClearCart = () => {
    clearCart()
    toast({
      title: 'Корзина очищена',
      status: 'info',
      duration: 2000,
      isClosable: true,
    })
  }

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>
          Корзина ({cart.quantity} товаров)
        </DrawerHeader>

        <DrawerBody>
          {cart.items.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text fontSize="lg" color="gray.500">
                Корзина пуста
              </Text>
            </Box>
          ) : (
            <VStack spacing={4} align="stretch">
              {cart.items.map((item) => (
                <Box key={item.id} p={4} borderWidth="1px" borderRadius="md">
                  <HStack spacing={4}>
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        boxSize="60px"
                        objectFit="cover"
                        borderRadius="md"
                      />
                    )}
                    
                    <VStack align="start" flex={1} spacing={1}>
                      <Text fontWeight="bold" fontSize="sm">
                        {item.name}
                      </Text>
                      {item.size && (
                        <Text fontSize="xs" color="gray.600">
                          Размер: {item.size}
                        </Text>
                      )}
                      {item.color && (
                        <Text fontSize="xs" color="gray.600">
                          Цвет: {item.color}
                        </Text>
                      )}
                      <Text fontWeight="bold" color="primary.500">
                        {item.price} ₴
                      </Text>
                    </VStack>

                    <VStack spacing={2}>
                      <NumberInput
                        size="sm"
                        maxW={20}
                        value={item.quantity}
                        min={1}
                        max={item.stock}
                        onChange={(_, value) => handleQuantityChange(item.id, value)}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      
                      <IconButton
                        aria-label="Удалить товар"
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleRemoveItem(item.id)}
                      />
                    </VStack>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </DrawerBody>

        {cart.items.length > 0 && (
          <DrawerFooter flexDirection="column" gap={4}>
            <Divider />
            
            <HStack justify="space-between" w="full">
              <Text fontSize="lg" fontWeight="bold">
                Итого: {cart.total} ₴
              </Text>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCart}
              >
                Очистить
              </Button>
            </HStack>

            <VStack w="full" spacing={2}>
              <Button
                colorScheme="primary"
                size="lg"
                w="full"
                onClick={onClose}
              >
                Оформить заказ
              </Button>
              <Button
                variant="outline"
                size="md"
                w="full"
                onClick={onClose}
              >
                Продолжить покупки
              </Button>
            </VStack>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
} 