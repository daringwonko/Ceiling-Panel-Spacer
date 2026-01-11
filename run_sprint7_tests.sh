#!/bin/bash
# Sprint 7 Test Runner

echo "=========================================="
echo "Running Phase 3 Sprint 7 Tests"
echo "=========================================="
echo ""

cd /workspaces/ceiling

echo "Testing AI Singularity Engine..."
python3 test_phase3_sprint7.py

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ ALL TESTS PASSED!"
    echo ""
    echo "Sprint 7 Complete:"
    echo "  ✓ Neural Architecture Generation (GAN)"
    echo "  ✓ Neural Style Transfer"
    echo "  ✓ Multi-Objective Optimization"
    echo "  ✓ Predictive ML"
    echo "  ✓ RL Integration"
    echo ""
    echo "Ready for Sprint 8!"
else
    echo "❌ TESTS FAILED"
    echo "Exit code: $EXIT_CODE"
fi

echo "=========================================="
exit $EXIT_CODE