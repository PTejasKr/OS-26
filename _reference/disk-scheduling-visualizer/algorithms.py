"""
Disk Scheduling Algorithm Visualizer - Core Algorithm Engine
============================================================
This module implements the four standard disk scheduling algorithms:
1. FCFS (First-Come, First-Served)
2. SSTF (Shortest Seek Time First)
3. SCAN (Elevator Algorithm)
4. C-SCAN (Circular SCAN)

Conventions & Movement Counting:
- Initial head position is the starting location, NOT a serviced request.
- If a request coincides with the initial head position, it is serviced with 0 distance.
- SCAN moves to the selected disk boundary (min_track or max_track) before reversing.
- C-SCAN travels to the disk boundary, performs a full circular wrap-around to the
  opposite boundary, and continues in the same direction.
- All physical movements (boundary travel and C-SCAN wrap-around) are counted in the
  total head movement.
- Average movement per request = total_movement / number_of_requests.
"""

from dataclasses import dataclass, field
from typing import List, Tuple, Optional, Dict, Any
import pandas as pd


@dataclass
class MovementStep:
    """Represents a single movement segment of the disk head."""
    step_number: int
    from_track: int
    to_track: int
    distance: int
    is_serviced_request: bool
    step_type: str  # 'REQUEST', 'BOUNDARY', 'WRAP_AROUND', 'START'
    description: str


@dataclass
class SimulationResult:
    """Encapsulates the complete execution output of a disk scheduling algorithm."""
    algorithm_name: str
    initial_head: int
    movement_path: List[int]
    serviced_requests: List[int]
    steps: List[MovementStep]
    total_movement: int
    average_movement: float
    request_count: int
    direction: Optional[str] = None
    min_track: int = 0
    max_track: int = 199
    notes: List[str] = field(default_factory=list)

    def to_dataframe(self) -> pd.DataFrame:
        """Converts step-by-step movement details to a pandas DataFrame."""
        if not self.steps:
            return pd.DataFrame(columns=[
                "Step", "From Track", "To Track", "Seek Distance (tracks)",
                "Action Type", "Description"
            ])
        data = []
        for s in self.steps:
            data.append({
                "Step": s.step_number,
                "From Track": s.from_track,
                "To Track": s.to_track,
                "Seek Distance (tracks)": s.distance,
                "Action Type": s.step_type,
                "Description": s.description
            })
        return pd.DataFrame(data)


def validate_inputs(
    raw_requests: Any,
    raw_head: Any,
    raw_min_track: Any,
    raw_max_track: Any,
    direction: str = "right"
) -> Tuple[Optional[List[int]], Optional[int], Optional[int], Optional[int], Optional[str], Optional[str]]:
    """
    Validates and parses user inputs for disk scheduling.

    Returns:
        (requests, head, min_track, max_track, direction, error_message)
        If valid, error_message is None.
    """
    # 1. Validate Track Boundaries
    try:
        min_track = int(raw_min_track)
    except (ValueError, TypeError):
        return None, None, None, None, None, "Minimum track must be a valid integer."

    try:
        max_track = int(raw_max_track)
    except (ValueError, TypeError):
        return None, None, None, None, None, "Maximum track must be a valid integer."

    if min_track < 0:
        return None, None, None, None, None, f"Minimum track cannot be negative (provided: {min_track})."

    if min_track >= max_track:
        return None, None, None, None, None, (
            f"Invalid track range: Minimum track ({min_track}) must be strictly less "
            f"than Maximum track ({max_track})."
        )

    # 2. Validate Initial Head Position
    try:
        head = int(raw_head)
    except (ValueError, TypeError):
        return None, None, None, None, None, "Initial head position must be a valid integer."

    if not (min_track <= head <= max_track):
        return None, None, None, None, None, (
            f"Initial head position ({head}) is outside the valid disk range "
            f"[{min_track}, {max_track}]."
        )

    # 3. Validate Direction
    norm_direction = str(direction).strip().lower()
    if norm_direction not in ("left", "right"):
        return None, None, None, None, None, (
            f"Invalid initial direction '{direction}'. Must be either 'left' or 'right'."
        )

    # 4. Validate Request Queue
    if isinstance(raw_requests, str):
        cleaned = raw_requests.replace(",", " ").strip()
        if not cleaned:
            return None, None, None, None, None, "Request queue is empty. Please enter track numbers."
        tokens = cleaned.split()
    elif isinstance(raw_requests, (list, tuple)):
        if len(raw_requests) == 0:
            return None, None, None, None, None, "Request queue is empty. Please provide at least one track request."
        tokens = raw_requests
    else:
        return None, None, None, None, None, "Request queue must be a comma-separated string or list of integers."

    parsed_requests: List[int] = []
    for token in tokens:
        try:
            req_val = int(token)
        except (ValueError, TypeError):
            return None, None, None, None, None, (
                f"Invalid track request '{token}'. All requests must be integers."
            )
        if not (min_track <= req_val <= max_track):
            return None, None, None, None, None, (
                f"Request track {req_val} is out of bounds. Valid range is [{min_track}, {max_track}]."
            )
        parsed_requests.append(req_val)

    if not parsed_requests:
        return None, None, None, None, None, "Request queue is empty. Please provide at least one valid track request."

    return parsed_requests, head, min_track, max_track, norm_direction, None


def fcfs(
    requests: List[int],
    initial_head: int,
    min_track: int = 0,
    max_track: int = 199
) -> SimulationResult:
    """
    First-Come, First-Served (FCFS) Disk Scheduling.
    Services track requests strictly in arrival order.
    """
    if not requests:
        return SimulationResult(
            algorithm_name="FCFS",
            initial_head=initial_head,
            movement_path=[initial_head],
            serviced_requests=[],
            steps=[],
            total_movement=0,
            average_movement=0.0,
            request_count=0,
            min_track=min_track,
            max_track=max_track,
            notes=["Request queue was empty. No head movement occurred."]
        )

    current = initial_head
    movement_path = [initial_head]
    serviced_requests = []
    steps = []
    total_movement = 0

    for idx, req in enumerate(requests, start=1):
        dist = abs(req - current)
        total_movement += dist
        desc = (
            f"Service request at track {req} (at initial head)"
            if dist == 0 and req == initial_head and idx == 1
            else f"Service request at track {req} (seek distance = {dist})"
        )
        steps.append(MovementStep(
            step_number=idx,
            from_track=current,
            to_track=req,
            distance=dist,
            is_serviced_request=True,
            step_type="REQUEST",
            description=desc
        ))
        serviced_requests.append(req)
        movement_path.append(req)
        current = req

    avg_movement = round(total_movement / len(requests), 2)
    return SimulationResult(
        algorithm_name="FCFS",
        initial_head=initial_head,
        movement_path=movement_path,
        serviced_requests=serviced_requests,
        steps=steps,
        total_movement=total_movement,
        average_movement=avg_movement,
        request_count=len(requests),
        min_track=min_track,
        max_track=max_track,
        notes=["FCFS does not reorder requests. Simple and starvation-free, but may cause high seek times."]
    )


def sstf(
    requests: List[int],
    initial_head: int,
    min_track: int = 0,
    max_track: int = 199
) -> SimulationResult:
    """
    Shortest Seek Time First (SSTF) Disk Scheduling.
    Selects the pending request closest to the current head position.
    
    Deterministic Tie-Breaking:
    If two pending requests are equidistant from current head, the lower track
    number is selected first. Duplicate requests are handled cleanly in FIFO order
    with 0 distance between duplicate visits.
    """
    if not requests:
        return SimulationResult(
            algorithm_name="SSTF",
            initial_head=initial_head,
            movement_path=[initial_head],
            serviced_requests=[],
            steps=[],
            total_movement=0,
            average_movement=0.0,
            request_count=0,
            min_track=min_track,
            max_track=max_track,
            notes=["Request queue was empty. No head movement occurred."]
        )

    pending = list(requests)
    current = initial_head
    movement_path = [initial_head]
    serviced_requests = []
    steps = []
    total_movement = 0
    step_num = 1

    while pending:
        # Tie-breaker key: (seek_distance, track_number)
        # Selects smallest seek distance; on tie, selects lower track number.
        best_req = min(pending, key=lambda r: (abs(r - current), r))
        pending.remove(best_req)

        dist = abs(best_req - current)
        total_movement += dist
        desc = (
            f"Service request at track {best_req} (closest pending request, seek distance = {dist})"
            if dist > 0
            else f"Service request at track {best_req} (0 seek distance, already at track)"
        )
        steps.append(MovementStep(
            step_number=step_num,
            from_track=current,
            to_track=best_req,
            distance=dist,
            is_serviced_request=True,
            step_type="REQUEST",
            description=desc
        ))
        serviced_requests.append(best_req)
        movement_path.append(best_req)
        current = best_req
        step_num += 1

    avg_movement = round(total_movement / len(requests), 2)
    return SimulationResult(
        algorithm_name="SSTF",
        initial_head=initial_head,
        movement_path=movement_path,
        serviced_requests=serviced_requests,
        steps=steps,
        total_movement=total_movement,
        average_movement=avg_movement,
        request_count=len(requests),
        min_track=min_track,
        max_track=max_track,
        notes=[
            "SSTF significantly reduces total seek time compared to FCFS.",
            "Tie-breaking rule: when two requests are equidistant, the lower track number is picked.",
            "Drawback: Prone to starvation for requests far from the active head cluster."
        ]
    )


def scan(
    requests: List[int],
    initial_head: int,
    min_track: int = 0,
    max_track: int = 199,
    direction: str = "right"
) -> SimulationResult:
    """
    SCAN (Elevator) Disk Scheduling.
    Moves in the chosen direction servicing requests along the way, travels to the
    selected disk boundary, reverses direction, and services remaining requests.

    Boundary Behavior:
    - The head travels all the way to the boundary in the initial direction
      (max_track if 'right', min_track if 'left').
    - If the boundary track was not explicitly requested, it is recorded in the physical
      movement path as a BOUNDARY stop (not a serviced request).
    - If requests exist in the opposite direction, the head reverses and services them.
    """
    direction = direction.lower()
    if not requests:
        return SimulationResult(
            algorithm_name="SCAN",
            initial_head=initial_head,
            movement_path=[initial_head],
            serviced_requests=[],
            steps=[],
            total_movement=0,
            average_movement=0.0,
            request_count=0,
            direction=direction,
            min_track=min_track,
            max_track=max_track,
            notes=["Request queue was empty. No head movement occurred."]
        )

    current = initial_head
    movement_path = [initial_head]
    serviced_requests = []
    steps = []
    total_movement = 0
    step_num = 1

    if direction == "right":
        # First leg: requests >= initial_head in ascending order
        first_leg = sorted([r for r in requests if r >= initial_head])
        # Second leg: requests < initial_head in descending order
        second_leg = sorted([r for r in requests if r < initial_head], reverse=True)
        boundary = max_track
    else:
        # First leg: requests <= initial_head in descending order
        first_leg = sorted([r for r in requests if r <= initial_head], reverse=True)
        # Second leg: requests > initial_head in ascending order
        second_leg = sorted([r for r in requests if r > initial_head])
        boundary = min_track

    # 1. Service first leg
    for req in first_leg:
        dist = abs(req - current)
        total_movement += dist
        desc = (
            f"Service request at track {req} (seek distance = {dist})"
            if dist > 0
            else f"Service request at track {req} (already at track, seek distance = 0)"
        )
        steps.append(MovementStep(
            step_number=step_num,
            from_track=current,
            to_track=req,
            distance=dist,
            is_serviced_request=True,
            step_type="REQUEST",
            description=desc
        ))
        serviced_requests.append(req)
        movement_path.append(req)
        current = req
        step_num += 1

    # 2. Travel to boundary (if not already at boundary)
    # Only travel to boundary if we haven't reached it yet
    if current != boundary:
        # Check if the boundary is an actual request that was serviced or a turnaround point
        dist = abs(boundary - current)
        total_movement += dist
        steps.append(MovementStep(
            step_number=step_num,
            from_track=current,
            to_track=boundary,
            distance=dist,
            is_serviced_request=False,
            step_type="BOUNDARY",
            description=f"Move to disk boundary at track {boundary} and reverse direction"
        ))
        movement_path.append(boundary)
        current = boundary
        step_num += 1

    # 3. Service second leg (reversed direction)
    for req in second_leg:
        dist = abs(req - current)
        total_movement += dist
        steps.append(MovementStep(
            step_number=step_num,
            from_track=current,
            to_track=req,
            distance=dist,
            is_serviced_request=True,
            step_type="REQUEST",
            description=f"Service request at track {req} after turnaround (seek distance = {dist})"
        ))
        serviced_requests.append(req)
        movement_path.append(req)
        current = req
        step_num += 1

    avg_movement = round(total_movement / len(requests), 2)
    return SimulationResult(
        algorithm_name="SCAN",
        initial_head=initial_head,
        movement_path=movement_path,
        serviced_requests=serviced_requests,
        steps=steps,
        total_movement=total_movement,
        average_movement=avg_movement,
        request_count=len(requests),
        direction=direction,
        min_track=min_track,
        max_track=max_track,
        notes=[
            f"SCAN moved {direction} first, reached boundary track {boundary}, then reversed.",
            "Boundary travel is explicitly tracked and counted in the total head movement.",
            "Boundary stop is distinguished as a non-serviced movement point unless requested."
        ]
    )


def c_scan(
    requests: List[int],
    initial_head: int,
    min_track: int = 0,
    max_track: int = 199,
    direction: str = "right"
) -> SimulationResult:
    """
    C-SCAN (Circular SCAN) Disk Scheduling.
    Services requests in one direction, travels to the disk boundary, wraps around
    to the opposite boundary, and continues in the same original direction.

    Movement Convention:
    - Full physical movement is reported. The wrap-around jump between disk boundaries
      (e.g., from max_track 199 to min_track 0) is counted as physical travel distance
      (|max_track - min_track| = 199 tracks), not 0.
    """
    direction = direction.lower()
    if not requests:
        return SimulationResult(
            algorithm_name="C-SCAN",
            initial_head=initial_head,
            movement_path=[initial_head],
            serviced_requests=[],
            steps=[],
            total_movement=0,
            average_movement=0.0,
            request_count=0,
            direction=direction,
            min_track=min_track,
            max_track=max_track,
            notes=["Request queue was empty. No head movement occurred."]
        )

    current = initial_head
    movement_path = [initial_head]
    serviced_requests = []
    steps = []
    total_movement = 0
    step_num = 1

    if direction == "right":
        # First leg: requests >= initial_head in ascending order
        first_leg = sorted([r for r in requests if r >= initial_head])
        # Second leg: requests < initial_head in ascending order (circular continuation)
        second_leg = sorted([r for r in requests if r < initial_head])
        outer_boundary = max_track
        wrap_boundary = min_track
    else:
        # First leg: requests <= initial_head in descending order
        first_leg = sorted([r for r in requests if r <= initial_head], reverse=True)
        # Second leg: requests > initial_head in descending order (circular continuation)
        second_leg = sorted([r for r in requests if r > initial_head], reverse=True)
        outer_boundary = min_track
        wrap_boundary = max_track

    # 1. Service first leg
    for req in first_leg:
        dist = abs(req - current)
        total_movement += dist
        desc = (
            f"Service request at track {req} (seek distance = {dist})"
            if dist > 0
            else f"Service request at track {req} (already at track, seek distance = 0)"
        )
        steps.append(MovementStep(
            step_number=step_num,
            from_track=current,
            to_track=req,
            distance=dist,
            is_serviced_request=True,
            step_type="REQUEST",
            description=desc
        ))
        serviced_requests.append(req)
        movement_path.append(req)
        current = req
        step_num += 1

    # 2. Reach outer boundary and wrap-around if requests remain in second leg
    if second_leg:
        # Reach outer boundary if not already there
        if current != outer_boundary:
            dist = abs(outer_boundary - current)
            total_movement += dist
            steps.append(MovementStep(
                step_number=step_num,
                from_track=current,
                to_track=outer_boundary,
                distance=dist,
                is_serviced_request=False,
                step_type="BOUNDARY",
                description=f"Move to disk boundary at track {outer_boundary}"
            ))
            movement_path.append(outer_boundary)
            current = outer_boundary
            step_num += 1

        # Wrap around to the opposite boundary
        wrap_dist = abs(wrap_boundary - current)
        total_movement += wrap_dist
        steps.append(MovementStep(
            step_number=step_num,
            from_track=current,
            to_track=wrap_boundary,
            distance=wrap_dist,
            is_serviced_request=False,
            step_type="WRAP_AROUND",
            description=(
                f"C-SCAN wrap-around: reset head from track {current} to opposite "
                f"boundary track {wrap_boundary} (physical movement = {wrap_dist} tracks)"
            )
        ))
        movement_path.append(wrap_boundary)
        current = wrap_boundary
        step_num += 1

        # 3. Service second leg in the same direction
        for req in second_leg:
            dist = abs(req - current)
            total_movement += dist
            steps.append(MovementStep(
                step_number=step_num,
                from_track=current,
                to_track=req,
                distance=dist,
                is_serviced_request=True,
                step_type="REQUEST",
                description=f"Service request at track {req} after wrap-around (seek distance = {dist})"
            ))
            serviced_requests.append(req)
            movement_path.append(req)
            current = req
            step_num += 1

    avg_movement = round(total_movement / len(requests), 2)
    return SimulationResult(
        algorithm_name="C-SCAN",
        initial_head=initial_head,
        movement_path=movement_path,
        serviced_requests=serviced_requests,
        steps=steps,
        total_movement=total_movement,
        average_movement=avg_movement,
        request_count=len(requests),
        direction=direction,
        min_track=min_track,
        max_track=max_track,
        notes=[
            f"C-SCAN swept {direction}, reached boundary {outer_boundary}, wrapped around to {wrap_boundary}.",
            f"The wrap-around distance ({abs(max_track - min_track)} tracks) is included in total head movement.",
            "C-SCAN provides uniform waiting time compared to standard SCAN."
        ]
    )


def run_all_algorithms(
    requests: List[int],
    initial_head: int,
    min_track: int = 0,
    max_track: int = 199,
    direction: str = "right"
) -> Dict[str, SimulationResult]:
    """Runs all four disk scheduling algorithms and returns their results."""
    return {
        "FCFS": fcfs(requests, initial_head, min_track, max_track),
        "SSTF": sstf(requests, initial_head, min_track, max_track),
        "SCAN": scan(requests, initial_head, min_track, max_track, direction),
        "C-SCAN": c_scan(requests, initial_head, min_track, max_track, direction),
    }


def generate_comparison_table(results: Dict[str, SimulationResult]) -> pd.DataFrame:
    """Generates a ranked comparison DataFrame of all algorithms."""
    rows = []
    for name, res in results.items():
        rows.append({
            "Algorithm": name,
            "Total Head Movement (tracks)": res.total_movement,
            "Average Seek (tracks/req)": res.average_movement,
            "Serviced Requests": len(res.serviced_requests),
            "Total Steps": len(res.steps),
            "Service Order": " → ".join(map(str, res.serviced_requests)) if res.serviced_requests else "None"
        })
    df = pd.DataFrame(rows)
    df.sort_values(by="Total Head Movement (tracks)", inplace=True)
    df.reset_index(drop=True, inplace=True)
    df.insert(0, "Rank", [f"#{i+1}" for i in range(len(df))])
    return df
