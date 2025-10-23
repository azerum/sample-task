Orders service needs tests:

1. Happy path: create order, publish event to both streams

2. Gateway down, still works: create order, publish event to payment-service,
ignore missing gateway
