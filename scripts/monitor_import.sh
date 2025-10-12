#!/bin/bash
# Monitor species import progress

echo "🔍 Monitoring Import Progress"
echo "=============================="
echo ""

# Check if process is running
PID=$(ps aux | grep "[p]ython3.*processIUCN" | awk '{print $2}')

if [ -z "$PID" ]; then
    echo "❌ No import process running"
    echo ""
    python3 scripts/quick_count.py
    exit 0
fi

echo "✅ Import process running (PID: $PID)"
echo ""

# Show current count
python3 scripts/quick_count.py
echo ""

# Show process info
echo "📊 Process Status:"
ps aux | grep "[p]ython3.*processIUCN" | awk '{printf "   CPU: %s%%\n   Memory: %s MB\n   Runtime: %s\n", $3, int($6/1024), $10}'
echo ""

echo "💡 Run this script again to check progress:"
echo "   bash scripts/monitor_import.sh"
