"""
Schedule Edge Case Tests

Tests edge cases for schedule endpoints:
- Empty objects array in schedule generate
- Invalid schedule_type
- Missing project_id in all 3 endpoints
- Non-existent project_id
"""

import json
import requests
import sys
import os

BASE_URL = "http://localhost:5000/api/bim"


def test_result(test_name, expected, actual):
    """Print test result"""
    status = "PASS" if expected == actual else "FAIL"
    print(f"[{status}] {test_name}")
    print(f"       Expected: {expected}")
    print(f"       Actual: {actual}")
    return status == "PASS"


def main():
    all_passed = True

    # Create a project first
    print("\n=== Creating Test Project ===")
    project_data = {
        "name": "Edge Case Test Project",
        "description": "Project for testing edge cases",
        "unit": "mm",
        "dimensions": {"width": 10000, "height": 5000},
    }

    response = requests.post(f"{BASE_URL}/projects", json=project_data)
    project_id = response.json()["data"]["id"]
    print(f"Created project: {project_id}")

    # Create test objects
    print("\n=== Creating Test Objects ===")
    door_obj = {
        "project_id": project_id,
        "type": "door",
        "name": "Test Door",
        "geometry": {"width": 900, "height": 2100},
        "material": "wood",
    }
    response = requests.post(f"{BASE_URL}/objects", json=door_obj)
    door_id = response.json()["data"]["id"]
    print(f"Created door object: {door_id}")

    window_obj = {
        "project_id": project_id,
        "type": "window",
        "name": "Test Window",
        "geometry": {"width": 1200, "height": 1200},
        "material": "aluminum",
    }
    response = requests.post(f"{BASE_URL}/objects", json=window_obj)
    window_id = response.json()["data"]["id"]
    print(f"Created window object: {window_id}")

    print("\n" + "=" * 70)
    print("EDGE CASE TESTS FOR SCHEDULE ENDPOINTS")
    print("=" * 70)

    # =====================================================================
    # Test 1: Empty objects array in schedule generate
    # =====================================================================
    print("\n--- Test 1: Empty objects array ---")

    data = {
        "project_id": project_id,
        "schedule_type": "door",
        "name": "Empty Schedule",
        "objects": [],
    }
    response = requests.post(f"{BASE_URL}/schedules/generate", json=data)
    expected = 201
    actual = response.status_code
    all_passed &= test_result("Empty objects array (generate)", expected, actual)

    response_data = response.json()
    print(f"       Rows count: {len(response_data.get('rows', []))}")
    print(f"       Expected rows: 0")

    # =====================================================================
    # Test 2: Invalid schedule_type
    # =====================================================================
    print("\n--- Test 2: Invalid schedule_type ---")

    data = {
        "project_id": project_id,
        "schedule_type": "invalid_type_xyz",
        "name": "Invalid Type Schedule",
    }
    response = requests.post(f"{BASE_URL}/schedules/generate", json=data)
    expected = 201
    actual = response.status_code
    all_passed &= test_result("Invalid schedule_type", expected, actual)

    # =====================================================================
    # Test 3: Missing project_id in /schedules/generate
    # =====================================================================
    print("\n--- Test 3: Missing project_id in generate endpoint ---")

    data = {"schedule_type": "door", "name": "No Project ID Schedule", "objects": []}
    response = requests.post(f"{BASE_URL}/schedules/generate", json=data)
    expected = 400
    actual = response.status_code
    all_passed &= test_result("Missing project_id (generate)", expected, actual)

    response_data = response.json()
    print(f"       Error message: {response_data.get('error', 'No error field')}")

    # =====================================================================
    # Test 4: Missing project_id in /schedules/export/excel
    # =====================================================================
    print("\n--- Test 4: Missing project_id in export/excel endpoint ---")

    data = {"schedule_type": "door", "options": {"include_metadata": True}}
    response = requests.post(f"{BASE_URL}/schedules/export/excel", json=data)
    expected = 404
    actual = response.status_code
    all_passed &= test_result("Missing project_id (export/excel)", expected, actual)

    # =====================================================================
    # Test 5: Missing project_id in /schedules/report
    # =====================================================================
    print("\n--- Test 5: Missing project_id in report endpoint ---")

    data = {"report_type": "summary"}
    response = requests.post(f"{BASE_URL}/schedules/report", json=data)
    expected = 404
    actual = response.status_code
    all_passed &= test_result("Missing project_id (report)", expected, actual)

    # =====================================================================
    # Test 6: Non-existent project_id in /schedules/generate
    # =====================================================================
    print("\n--- Test 6: Non-existent project_id in generate endpoint ---")

    data = {
        "project_id": "nonexistent-project-id-12345",
        "schedule_type": "door",
        "name": "Ghost Project Schedule",
    }
    response = requests.post(f"{BASE_URL}/schedules/generate", json=data)
    expected = 404
    actual = response.status_code
    all_passed &= test_result("Non-existent project_id (generate)", expected, actual)

    # =====================================================================
    # Test 7: Non-existent project_id in /schedules/export/excel
    # =====================================================================
    print("\n--- Test 7: Non-existent project_id in export/excel endpoint ---")

    data = {"project_id": "nonexistent-project-id-12345", "schedule_type": "door"}
    response = requests.post(f"{BASE_URL}/schedules/export/excel", json=data)
    expected = 404
    actual = response.status_code
    all_passed &= test_result(
        "Non-existent project_id (export/excel)", expected, actual
    )

    # =====================================================================
    # Test 8: Non-existent project_id in /schedules/report
    # =====================================================================
    print("\n--- Test 8: Non-existent project_id in report endpoint ---")

    data = {"project_id": "nonexistent-project-id-12345", "report_type": "summary"}
    response = requests.post(f"{BASE_URL}/schedules/report", json=data)
    expected = 404
    actual = response.status_code
    all_passed &= test_result("Non-existent project_id (report)", expected, actual)

    # =====================================================================
    # Test 9: Empty JSON body
    # =====================================================================
    print("\n--- Test 9: Empty JSON body in generate endpoint ---")

    response = requests.post(f"{BASE_URL}/schedules/generate", json={})
    expected = 400
    actual = response.status_code
    all_passed &= test_result("Empty JSON body (generate)", expected, actual)

    # =====================================================================
    # Test 10: Empty JSON body in export/excel
    # =====================================================================
    print("\n--- Test 10: Empty JSON body in export/excel endpoint ---")

    response = requests.post(f"{BASE_URL}/schedules/export/excel", json={})
    expected = 404
    actual = response.status_code
    all_passed &= test_result("Empty JSON body (export/excel)", expected, actual)

    # =====================================================================
    # Test 11: Empty JSON body in report
    # =====================================================================
    print("\n--- Test 11: Empty JSON body in report endpoint ---")

    response = requests.post(f"{BASE_URL}/schedules/report", json={})
    expected = 404
    actual = response.status_code
    all_passed &= test_result("Empty JSON body (report)", expected, actual)

    # =====================================================================
    # Test 12: Valid request with objects to verify functionality
    # =====================================================================
    print("\n--- Test 12: Valid request with objects ---")

    data = {
        "project_id": project_id,
        "schedule_type": "door",
        "name": "Valid Door Schedule",
        "objects": [
            {
                "id": door_id,
                "type": "door",
                "geometry": {"width": 900, "height": 2100},
                "material": "wood",
            }
        ],
    }
    response = requests.post(f"{BASE_URL}/schedules/generate", json=data)
    expected = 201
    actual = response.status_code
    all_passed &= test_result("Valid request with objects", expected, actual)

    response_data = response.json()
    print(f"       Response: {response_data}")

    # =====================================================================
    # Cleanup
    # =====================================================================
    print("\n=== Cleanup ===")
    response = requests.delete(f"{BASE_URL}/projects/{project_id}")
    print(f"Deleted test project: {project_id}")

    # =====================================================================
    # Summary
    # =====================================================================
    print("\n" + "=" * 70)
    print("EDGE CASE TEST SUMMARY")
    print("=" * 70)
    if all_passed:
        print("\n[SUCCESS] All edge case tests passed!")
    else:
        print("\n[FAILURE] Some tests failed!")

    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
