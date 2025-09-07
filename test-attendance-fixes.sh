#!/bin/bash

# Test script to verify attendance fixes
echo "🧪 TESTING ATTENDANCE FIXES - September 8, 2025"
echo "=================================================="

# Get fresh token
TOKEN=$(node test-token.js | grep "eyJ" | head -1)
echo "✅ Generated fresh JWT token"

# Base URL
BASE_URL="http://localhost:3000/api/attendance"

echo ""
echo "📋 TESTING PREVIOUSLY FAILING ROUTES"
echo "-------------------------------------"

# Test 1: Students route (previously 404)
echo "🔍 Testing GET /students..."
RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/students")
if echo "$RESULT" | grep -q '"success":true'; then
    echo "✅ GET /students - WORKING"
else
    echo "❌ GET /students - FAILED"
    echo "   Response: $RESULT"
fi

# Test 2: Summary route (previously 404)
echo "🔍 Testing GET /summary..."
RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/summary?date=2025-09-08")
if echo "$RESULT" | grep -q '"success":true'; then
    echo "✅ GET /summary - WORKING"
else
    echo "❌ GET /summary - FAILED"
    echo "   Response: $RESULT"
fi

# Test 3: Report route (previously 404)
echo "🔍 Testing GET /report..."
RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/report")
if echo "$RESULT" | grep -q '"success":true'; then
    echo "✅ GET /report - WORKING"
else
    echo "❌ GET /report - FAILED"
    echo "   Response: $RESULT"
fi

# Test 4: Bulk record route (previously validation error)
echo "🔍 Testing POST /bulk-record..."
RESULT=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"records":[{"type":"teacher","teacher_id":"1","status":"Masuk"}]}' "$BASE_URL/bulk-record")
if echo "$RESULT" | grep -q '"success":true'; then
    echo "✅ POST /bulk-record - WORKING"
else
    echo "❌ POST /bulk-record - FAILED"
    echo "   Response: $RESULT"
fi

echo ""
echo "📊 TESTING CORE ROUTES (should still work)"
echo "-------------------------------------------"

# Test 5: My status
echo "🔍 Testing GET /my-status..."
RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/my-status")
if echo "$RESULT" | grep -q '"success":true'; then
    echo "✅ GET /my-status - WORKING"
else
    echo "❌ GET /my-status - FAILED"
fi

# Test 6: My attendance
echo "🔍 Testing GET /my-attendance..."
RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/my-attendance")
if echo "$RESULT" | grep -q '"success":true'; then
    echo "✅ GET /my-attendance - WORKING"
else
    echo "❌ GET /my-attendance - FAILED"
fi

# Test 7: Teachers list
echo "🔍 Testing GET /teachers..."
RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/teachers")
if echo "$RESULT" | grep -q '"success":true'; then
    echo "✅ GET /teachers - WORKING"
else
    echo "❌ GET /teachers - FAILED"
fi

# Test 8: Stats
echo "🔍 Testing GET /stats..."
RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/stats")
if echo "$RESULT" | grep -q '"success":true'; then
    echo "✅ GET /stats - WORKING"
else
    echo "❌ GET /stats - FAILED"
fi

echo ""
echo "🎯 TESTING PARAMETRIC ROUTES"
echo "-----------------------------"

# Test 9: Specific teacher
echo "🔍 Testing GET /teachers/1..."
RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/teachers/1")
if echo "$RESULT" | grep -q '"success":true'; then
    echo "✅ GET /teachers/1 - WORKING"
else
    echo "❌ GET /teachers/1 - FAILED"
fi

# Test 10: Daily report
echo "🔍 Testing GET /daily-report/2025-09-08..."
RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/daily-report/2025-09-08")
if echo "$RESULT" | grep -q '"success":true'; then
    echo "✅ GET /daily-report/2025-09-08 - WORKING"
else
    echo "❌ GET /daily-report/2025-09-08 - FAILED"
fi

echo ""
echo "🏁 TESTING COMPLETE"
echo "==================="
echo "✅ All previously failing routes should now be working"
echo "🧹 Debug console.log statements removed"
echo "🔧 Validation schemas fixed"
echo "📋 Route ordering optimized"
