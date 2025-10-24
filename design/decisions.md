# Gateway queue durability

If gateway is down, it implies that subscribers see broken connection. Therefore queues might be dropped once gateway is down - use `durable: false`

# GraphQL subscribers semantics

Options:

1. Message is delivered only as long as subscriber is subscribed; dead WebSocket connection must be detected, and subscriber must refetch latest state in such case

2. Message is delivered at least once per subscriber; subscriber somehow declares that it is subscribed; while it is not connected, messages are buffered (perhaps
with some TTL)

Likely, not buffering messages and letting client detect broken connection is
simpler. Let's go with #1

# Publishing event to two queues

When we publish OrderCreated, we want both gateway and payments-service to
get the event. If gateway is down, we may discard the event

If payments-service is down, we must fail/retry forever, as payment must 
be eventually processed

Simple way to do it is to publish to two RabbitMQ exchanges in parallel,
and fail if publishing to either fails

`mandatory: true` will be set when publishing to payments-service's exchange
to ensure the publish fails if payments-service did not create its queue yet

`mandatory: false` will be set for gateway as if it's down it does not need
event

# Order dedup

Consider scenario:

1. API client sends createOrder
2. Orders service creates order
3. Network fails, API client gets back an error

Client must retry, therefore createOrder must be idempotent. To achieve that,
we need ID identifying the creation of the order

## ID format

ID must be non-overlapping among clients, as that would cause confusing bugs

Simple way is to use ID in format:

`${userId}.${requestId}`

userId must be set by the gateway - clients may spoof it

requestId is set by the client. If same user can be logged in on multiple devices,
userId should be deviceId instead

Each client will use requestId in format:

`${startTimestamp}.${seq}`

This allows for concurrent requests of the client (seq-incrementing is serialized)
and no collisions of old requests with new ones after client restarts
(startTimestamp will change)

## ID and PK of orders

Orders in DB will have to unique columns:

- id number
- create_request_id string

`id` is primary key - more compact to work with, smaller for indexes. 
`create_request_id` is used for upsert

# Data in OrderCreated event

Previously I included productName in OrderCreated event. Now for simplicity
of keeping code updated on changes, I include just ID and createdAtMs

Orders web app likely either knows order info already or can fetch it

# Outbox table

Instead of outbox table for orders, I used Order.sentCreatedEvent and partial index
when it is false. This keeps a small index for just orders with unpublished events

This avoids manual logic of adding/deleting entries - just lookup orders by 
`sentCreatedEvent: false` and set it to `true` when published

This also gives atomic "add order" and "add outbox table entry" (where outbox
table entry is really just a `sentCreatedEvent: false`)
