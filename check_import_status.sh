#!/bin/bash
# Quick status check for IUCN import

echo "=== IUCN Import Status ==="
echo ""

# Check if process is running
if pgrep -f processIUCNShapefiles.py > /dev/null; then
    echo "✅ Import process is running"
else
    echo "⏸️  Import process not found"
fi

echo ""
echo "=== Progress ==="
grep "^\[" iucn_import.log | tail -3

echo ""
echo "=== Latest Completed ==="
grep "✓ Completed" iucn_import.log | tail -5

echo ""
echo "=== Summary (if finished) ==="
grep -A 5 "Processing Complete" iucn_import.log | tail -6
