"""
Automated Test Suite for Disk Scheduling Visualizer
===================================================
Tests core algorithm logic, edge cases, tie-breaking, boundary movement,
wrap-around calculations, and input validation.
"""

import pytest
from algorithms import (
    validate_inputs,
    fcfs,
    sstf,
    scan,
    c_scan,
    run_all_algorithms,
    generate_comparison_table
)

SAMPLE_QUEUE = [98, 183, 37, 122, 14, 124, 65, 67]
INITIAL_HEAD = 53
MIN_TRACK = 0
MAX_TRACK = 199


# ==============================================================================
# 1. TEXTBOOK SAMPLE QUEUE TESTS (Silberschatz OS Concepts Reference)
# ==============================================================================

def test_fcfs_standard_sample():
    """Verify FCFS matches standard textbook result (640 tracks)."""
    res = fcfs(SAMPLE_QUEUE, INITIAL_HEAD, MIN_TRACK, MAX_TRACK)
    assert res.serviced_requests == SAMPLE_QUEUE
    assert res.movement_path == [53, 98, 183, 37, 122, 14, 124, 65, 67]
    assert res.total_movement == 640
    assert res.average_movement == 80.0
    assert len(res.steps) == 8


def test_sstf_standard_sample():
    """Verify SSTF matches standard textbook result (236 tracks)."""
    res = sstf(SAMPLE_QUEUE, INITIAL_HEAD, MIN_TRACK, MAX_TRACK)
    expected_order = [65, 67, 37, 14, 98, 122, 124, 183]
    assert res.serviced_requests == expected_order
    assert res.movement_path == [53] + expected_order
    assert res.total_movement == 236
    assert res.average_movement == 29.5
    assert len(res.steps) == 8


def test_scan_right_standard_sample():
    """Verify SCAN moving right visits 199 boundary, reverses, and reaches 331 tracks."""
    res = scan(SAMPLE_QUEUE, INITIAL_HEAD, MIN_TRACK, MAX_TRACK, direction="right")
    expected_service = [65, 67, 98, 122, 124, 183, 37, 14]
    expected_path = [53, 65, 67, 98, 122, 124, 183, 199, 37, 14]
    assert res.serviced_requests == expected_service
    assert res.movement_path == expected_path
    assert res.total_movement == 331
    assert res.average_movement == round(331 / 8, 2)
    # Check that 199 is recorded as a BOUNDARY step, not a serviced request
    boundary_steps = [s for s in res.steps if s.step_type == "BOUNDARY"]
    assert len(boundary_steps) == 1
    assert boundary_steps[0].to_track == 199
    assert not boundary_steps[0].is_serviced_request


def test_scan_left_standard_sample():
    """Verify SCAN moving left visits 0 boundary, reverses, and services remaining requests."""
    res = scan(SAMPLE_QUEUE, INITIAL_HEAD, MIN_TRACK, MAX_TRACK, direction="left")
    expected_service = [37, 14, 65, 67, 98, 122, 124, 183]
    expected_path = [53, 37, 14, 0, 65, 67, 98, 122, 124, 183]
    assert res.serviced_requests == expected_service
    assert res.movement_path == expected_path
    # (53 - 0) + (183 - 0) = 53 + 183 = 236 tracks
    assert res.total_movement == 236
    assert res.average_movement == 29.5
    boundary_steps = [s for s in res.steps if s.step_type == "BOUNDARY"]
    assert len(boundary_steps) == 1
    assert boundary_steps[0].to_track == 0


def test_c_scan_right_standard_sample():
    """Verify C-SCAN moving right travels to 199, wraps around to 0 (199 tracks), then services 14, 37."""
    res = c_scan(SAMPLE_QUEUE, INITIAL_HEAD, MIN_TRACK, MAX_TRACK, direction="right")
    expected_service = [65, 67, 98, 122, 124, 183, 14, 37]
    expected_path = [53, 65, 67, 98, 122, 124, 183, 199, 0, 14, 37]
    assert res.serviced_requests == expected_service
    assert res.movement_path == expected_path
    # (199 - 53) + 199 (wrap) + (37 - 0) = 146 + 199 + 37 = 382 tracks
    assert res.total_movement == 382
    assert res.average_movement == round(382 / 8, 2)

    wrap_steps = [s for s in res.steps if s.step_type == "WRAP_AROUND"]
    assert len(wrap_steps) == 1
    assert wrap_steps[0].from_track == 199
    assert wrap_steps[0].to_track == 0
    assert wrap_steps[0].distance == 199
    assert not wrap_steps[0].is_serviced_request


def test_c_scan_left_standard_sample():
    """Verify C-SCAN moving left travels to 0, wraps around to 199 (199 tracks), then services remaining."""
    res = c_scan(SAMPLE_QUEUE, INITIAL_HEAD, MIN_TRACK, MAX_TRACK, direction="left")
    expected_service = [37, 14, 183, 124, 122, 98, 67, 65]
    expected_path = [53, 37, 14, 0, 199, 183, 124, 122, 98, 67, 65]
    assert res.serviced_requests == expected_service
    assert res.movement_path == expected_path
    # (53 - 0) + 199 (wrap) + (199 - 65) = 53 + 199 + 134 = 386 tracks
    assert res.total_movement == 386
    assert res.average_movement == round(386 / 8, 2)


# ==============================================================================
# 2. EDGE CASES: EMPTY, DUPLICATES, HEAD POSITION REQUESTS
# ==============================================================================

def test_empty_requests():
    """All algorithms handle empty queue gracefully with 0 movement."""
    for algo_fn in [fcfs, sstf]:
        res = algo_fn([], initial_head=50, min_track=0, max_track=199)
        assert res.total_movement == 0
        assert res.average_movement == 0.0
        assert res.movement_path == [50]
        assert res.serviced_requests == []
        assert res.steps == []

    for algo_fn in [scan, c_scan]:
        for d in ["left", "right"]:
            res = algo_fn([], initial_head=50, min_track=0, max_track=199, direction=d)
            assert res.total_movement == 0
            assert res.average_movement == 0.0
            assert res.movement_path == [50]
            assert res.serviced_requests == []
            assert res.steps == []


def test_duplicate_requests():
    """Duplicate requests are both serviced and recorded with 0 distance between duplicate visits."""
    queue = [37, 37, 98]
    res_sstf = sstf(queue, initial_head=53, min_track=0, max_track=199)
    assert res_sstf.serviced_requests == [37, 37, 98]
    # 53 -> 37 (16), 37 -> 37 (0), 37 -> 98 (61) = 77
    assert res_sstf.total_movement == 77
    assert len(res_sstf.serviced_requests) == 3


def test_request_at_initial_head_position():
    """Request located exactly at initial head position is serviced with 0 seek distance."""
    queue = [53, 98, 37]
    res = fcfs(queue, initial_head=53, min_track=0, max_track=199)
    assert res.serviced_requests == [53, 98, 37]
    assert res.steps[0].from_track == 53
    assert res.steps[0].to_track == 53
    assert res.steps[0].distance == 0
    assert res.steps[0].is_serviced_request is True
    # 0 + 45 + 61 = 106
    assert res.total_movement == 106
    assert res.average_movement == round(106 / 3, 2)


def test_sstf_deterministic_tie_breaking():
    """Equidistant requests break ties by selecting the lower track number first."""
    # Head at 50, requests at 40 and 60 (both distance 10)
    queue = [60, 40]
    res = sstf(queue, initial_head=50, min_track=0, max_track=100)
    # 40 should be chosen first because 40 < 60
    assert res.serviced_requests == [40, 60]
    assert res.movement_path == [50, 40, 60]
    # 50 -> 40 (10), 40 -> 60 (20) = 30
    assert res.total_movement == 30


def test_requests_at_boundaries():
    """Requests placed exactly at min_track and max_track boundaries."""
    queue = [0, 199]
    res_scan = scan(queue, initial_head=100, min_track=0, max_track=199, direction="right")
    # Head moves right: services 199 (at boundary), reverses, services 0
    assert res_scan.serviced_requests == [199, 0]
    # 100 -> 199 (99), 199 -> 0 (199) = 298 tracks
    assert res_scan.total_movement == 298


# ==============================================================================
# 3. HAND-VERIFIED CALCULATION INTEGRITY
# ==============================================================================

def test_hand_verified_integrity_all_algorithms():
    """Independently verify step sums and average movement calculations for all algorithms."""
    results = run_all_algorithms(SAMPLE_QUEUE, INITIAL_HEAD, MIN_TRACK, MAX_TRACK, direction="right")
    for name, res in results.items():
        # Step sum verification
        manual_sum = sum(s.distance for s in res.steps)
        assert res.total_movement == manual_sum, f"{name}: total_movement does not match sum of steps"

        # Step distance verification: |to_track - from_track|
        for s in res.steps:
            assert s.distance == abs(s.to_track - s.from_track), f"{name}: step distance mismatch"

        # Average movement verification
        expected_avg = round(res.total_movement / len(SAMPLE_QUEUE), 2)
        assert res.average_movement == expected_avg, f"{name}: average movement calculation error"

        # Serviced request count verification (initial head not counted)
        assert len(res.serviced_requests) == len(SAMPLE_QUEUE), f"{name}: serviced count error"


# ==============================================================================
# 4. INPUT VALIDATION TESTS
# ==============================================================================

def test_validate_valid_inputs():
    """Correct inputs parse cleanly without errors."""
    reqs, head, min_t, max_t, dirn, err = validate_inputs(
        "98, 183, 37, 122", "53", "0", "199", "right"
    )
    assert err is None
    assert reqs == [98, 183, 37, 122]
    assert head == 53
    assert min_t == 0
    assert max_t == 199
    assert dirn == "right"


def test_validate_non_integer_requests():
    """Non-integer track values return clear error."""
    _, _, _, _, _, err = validate_inputs("98, abc, 37", 53, 0, 199, "right")
    assert err is not None
    assert "abc" in err


def test_validate_out_of_bounds_request():
    """Requests outside [min_track, max_track] are rejected."""
    _, _, _, _, _, err = validate_inputs("98, 250, 37", 53, 0, 199, "right")
    assert err is not None
    assert "250" in err
    assert "out of bounds" in err.lower()


def test_validate_head_out_of_bounds():
    """Head position outside [min_track, max_track] is rejected."""
    _, _, _, _, _, err = validate_inputs("98, 37", 250, 0, 199, "right")
    assert err is not None
    assert "250" in err
    assert "outside" in err.lower()


def test_validate_invalid_track_range():
    """min_track >= max_track is rejected."""
    _, _, _, _, _, err = validate_inputs("98, 37", 50, 199, 100, "right")
    assert err is not None
    assert "strictly less than" in err


def test_validate_negative_min_track():
    """Negative min_track is rejected."""
    _, _, _, _, _, err = validate_inputs("98, 37", 50, -10, 100, "right")
    assert err is not None
    assert "negative" in err.lower()


def test_validate_empty_request_queue():
    """Empty request queue string is rejected."""
    _, _, _, _, _, err = validate_inputs("   ", 50, 0, 199, "right")
    assert err is not None
    assert "empty" in err.lower()


def test_comparison_table_generation():
    """Comparison table correctly ranks algorithms by total head movement."""
    results = run_all_algorithms(SAMPLE_QUEUE, INITIAL_HEAD, MIN_TRACK, MAX_TRACK, direction="right")
    df = generate_comparison_table(results)
    assert len(df) == 4
    # SSTF should be #1 for this sample (236 tracks)
    assert df.iloc[0]["Algorithm"] == "SSTF"
    assert df.iloc[0]["Total Head Movement (tracks)"] == 236
    # FCFS should be #4 for this sample (640 tracks)
    assert df.iloc[3]["Algorithm"] == "FCFS"
    assert df.iloc[3]["Total Head Movement (tracks)"] == 640
