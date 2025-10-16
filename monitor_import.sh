#!/bin/bash
# Continuous monitoring of IUCN import progress

LOG_FILE="iucn_import_final.log"

clear
echo "═══════════════════════════════════════════════════════════"
echo "         IUCN Species Import - Live Monitor"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check if process is running
if pgrep -f processIUCNShapefiles.py > /dev/null; then
    echo "✅ Import process: RUNNING"
else
    echo "⏸️  Import process: NOT FOUND"
fi

echo ""
echo "───────────────────────────────────────────────────────────"
echo "  PROGRESS"
echo "───────────────────────────────────────────────────────────"

# Get current archive being processed
CURRENT=$(grep "^\[" "$LOG_FILE" | tail -1)
echo "$CURRENT"

# Count completed archives
COMPLETED=$(grep -c "✓ Completed" "$LOG_FILE")
echo "Completed: $COMPLETED/30 archives ($(( COMPLETED * 100 / 30 ))%)"

echo ""
echo "───────────────────────────────────────────────────────────"
echo "  RECENTLY COMPLETED"
echo "───────────────────────────────────────────────────────────"
grep "✓ Completed" "$LOG_FILE" | tail -5 | sed 's/^/  /'

echo ""
echo "───────────────────────────────────────────────────────────"
echo "  SPECIES COUNT"
echo "───────────────────────────────────────────────────────────"
# Sum up all successfully inserted counts
TOTAL=$(grep "Successfully inserted:" "$LOG_FILE" | awk '{sum+=$NF} END {print sum}')
echo "  Total species imported: ${TOTAL:-0}"

echo ""
echo "───────────────────────────────────────────────────────────"
echo "  LATEST ACTIVITY"
echo "───────────────────────────────────────────────────────────"
tail -3 "$LOG_FILE" | sed 's/^/  /'

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "Run: watch -n 5 ./monitor_import.sh    (auto-refresh every 5s)"
echo "Or:  tail -f $LOG_FILE                 (live log)"
echo "═══════════════════════════════════════════════════════════"
