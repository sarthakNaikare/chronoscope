import re

def parse_explain(text: str) -> dict:
    text = text or ""
    scanned_match = re.search(r"Chunks excluded:\s*(\d+)\s*of\s*(\d+)", text, re.IGNORECASE)
    total_chunks  = int(scanned_match.group(2)) if scanned_match else 0
    excluded      = int(scanned_match.group(1)) if scanned_match else 0
    scanned       = total_chunks - excluded

    if not scanned_match:
        m = re.search(r"(\d+)\s+chunks?\s+scanned", text, re.IGNORECASE)
        scanned = int(m.group(1)) if m else 0

    hit_match  = re.search(r"hit=(\d+)", text)
    read_match = re.search(r"read=(\d+)", text)
    hits       = int(hit_match.group(1))  if hit_match  else 0
    reads      = int(read_match.group(1)) if read_match else 0
    total_buf  = hits + reads
    hit_ratio  = round(hits / total_buf * 100, 1) if total_buf > 0 else 100.0
    has_custom = bool(re.search(r"Custom Scan|ChunkAppend|DecompressChunk", text, re.IGNORECASE))

    issues = []
    if scanned > 3:
        issues.append(f"chunk exclusion failed on {scanned - 3} extra chunks")
    if hit_ratio < 80:
        issues.append(f"buffer hit ratio only {hit_ratio}%")
    if has_custom and reads > 1000:
        issues.append("compressed chunks being decompressed mid-query")

    return {
        "chunks_scanned": scanned, "chunks_excluded": excluded,
        "buffer_hit_ratio": hit_ratio, "has_custom_scan": has_custom,
        "diagnosis": "; ".join(issues) if issues else "no major issues detected",
        "estimated_savings_seconds": round(max(0, scanned - 3) * 0.45, 1),
    }
