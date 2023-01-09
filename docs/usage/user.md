# Users

Basic CRUD for interacting with the JSON API's user resources.

## Create

### Request

```shell
curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"my@email.com"}' \
  http://localhost:3000/users/
```

### Response

```json
{
  "user": {
    "id": 2,
    "username": "new-user",
    "email": "my@email.com",
    "created_at": "2018-04-03 14:43:02.183277-04",
    "updated_at": "2018-04-03 14:43:02.183277-04"
  }
}
```
