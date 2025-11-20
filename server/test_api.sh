#!/bin/bash

# 1. Login and get token
echo "Logging in..."
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Token: $TOKEN"

if [ -z "$TOKEN" ]; then
  echo "Login failed"
  exit 1
fi

# 2. Create Transaction
echo "Creating transaction..."
CREATE_RES=$(curl -s -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"earn","amount":500,"description":"Curl Test","date":"2023-10-27"}')
echo "Create Response: $CREATE_RES"

ID=$(echo $CREATE_RES | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo "Transaction ID: $ID"

# 3. Update Transaction
echo "Updating transaction..."
curl -s -X PUT http://localhost:3000/api/transactions/$ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"earn","amount":1000,"description":"Curl Updated","date":"2023-10-27"}'
echo ""

# 4. Delete Transaction
echo "Deleting transaction..."
curl -s -X DELETE http://localhost:3000/api/transactions/$ID \
  -H "Authorization: Bearer $TOKEN"
echo ""
