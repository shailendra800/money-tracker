#!/bin/bash

# 1. Login and get token
echo "Logging in..."
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed"
  exit 1
fi

# 2. Create Transactions
echo "Creating transactions..."
# Oct 2023
curl -s -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"earn","amount":100,"description":"Oct Data","date":"2023-10-15"}' > /dev/null

# Nov 2023
curl -s -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"earn","amount":200,"description":"Nov Data","date":"2023-11-15"}' > /dev/null

# 3. Test Filtering
echo "Testing Oct 2023 Filter..."
OCT_RES=$(curl -s -G http://localhost:3000/api/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -d "month=10" -d "year=2023")
echo $OCT_RES | grep "Oct Data" && echo "PASS: Found Oct Data" || echo "FAIL: Missing Oct Data"
echo $OCT_RES | grep "Nov Data" && echo "FAIL: Found Nov Data in Oct" || echo "PASS: No Nov Data in Oct"

echo "Testing Nov 2023 Filter..."
NOV_RES=$(curl -s -G http://localhost:3000/api/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -d "month=11" -d "year=2023")
echo $NOV_RES | grep "Nov Data" && echo "PASS: Found Nov Data" || echo "FAIL: Missing Nov Data"
echo $NOV_RES | grep "Oct Data" && echo "FAIL: Found Oct Data in Nov" || echo "PASS: No Oct Data in Nov"

echo "Testing Year 2023 Filter..."
YEAR_RES=$(curl -s -G http://localhost:3000/api/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -d "year=2023")
echo $YEAR_RES | grep "Oct Data" && echo "PASS: Found Oct Data" || echo "FAIL: Missing Oct Data"
echo $YEAR_RES | grep "Nov Data" && echo "PASS: Found Nov Data" || echo "FAIL: Missing Nov Data"
