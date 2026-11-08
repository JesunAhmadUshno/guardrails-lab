"""Rule-based guardrails, Learn level. Stdlib only.

Defensive safety work only. Three parts:
1. PII detection and redaction (synthetic examples only in tests).
2. Input filter scoring named policy classes with explicit rules.
3. Output filter (same policy scoring plus PII leakage redaction)
   and a combined check API.

Limits are stated in REPORT.md (Learn section): rules are brittle, they miss
paraphrases, and they are not a model. That brittleness is measured,
in part, by the benign false positive rate in the evaluation.
"""
import re

# ---------------------------------------------------------------- PII

EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
PHONE_RE = re.compile(r"\b\d{3}[-. ]\d{3}[-. ]\d{4}\b")
SSN_RE = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
CARD_RE = re.compile(r"\b(?:\d{4}[ ]?){3}\d{4}\b|\b\d{13,16}\b")


def luhn_ok(digits):
    """True if a digit string passes the Luhn checksum."""
    total = 0
    alt = False
    for ch in reversed(digits):
        d = int(ch)
        if alt:
            d *= 2
            if d > 9:
                d -= 9
        total += d
        alt = not alt
    return total % 10 == 0 and len(digits) >= 13


def find_pii(text):
    """Return findings as dicts with type, start, end, text.

    Order: by start, then longest first. Overlapping candidates from
    a lower priority detector are dropped so spans never overlap.
    Credit card candidates are kept only if Luhn passes.
    """
    candidates = []
    for m in EMAIL_RE.finditer(text):
        candidates.append(("EMAIL", m.start(), m.end(), m.group()))
    for m in SSN_RE.finditer(text):
        candidates.append(("SSN", m.start(), m.end(), m.group()))
    for m in CARD_RE.finditer(text):
        digits = re.sub(r"\D", "", m.group())
        if luhn_ok(digits):
            candidates.append(("CREDIT_CARD", m.start(), m.end(), m.group()))
    for m in PHONE_RE.finditer(text):
        candidates.append(("PHONE", m.start(), m.end(), m.group()))
    candidates.sort(key=lambda c: (c[1], -(c[2] - c[1])))
    findings = []
    used = []
    for typ, start, end, val in candidates:
        if any(start < u_end and end > u_start for u_start, u_end in used):
            continue
        used.append((start, end))
        findings.append({"type": typ, "start": start, "end": end, "text": val})
    findings.sort(key=lambda f: f["start"])
    return findings


def redact(text):
    """Return (redacted_text, findings). Replaces each span in place."""
    findings = find_pii(text)
    out = text
    for f in reversed(findings):
        out = out[:f["start"]] + "[REDACTED:" + f["type"] + "]" + out[f["end"]:]
    return out, findings


# ------------------------------------------------------- policy rules
# Each rule: (regex, weight). A class blocks at score >= BLOCK_AT.
# Weights are hand set: a strong imperative phrase is 2, a weak
# signal word alone is 1 and never blocks on its own. That is why a
# benign discussion of a topic word does not block.

BLOCK_AT = 2

POLICY_RULES = {
    "jailbreak": [
        (r"ignore (all )?(previous|prior|above) instructions", 2),
        (r"disregard (your|all) instructions", 2),
        (r"reveal your system prompt", 2),
        (r"you are now dan\b", 2),
        (r"pretend you have no rules", 2),
        (r"\bbypass\b.{0,30}\b(safety|filters|restrictions)\b", 2),
        (r"developer mode", 1),
        (r"no restrictions", 1),
        (r"without rules", 1),
        (r"\bjailbreak\b", 1),
    ],
    "prompt_injection": [
        (r"\[system\]", 2),
        (r"system message\s*:", 2),
        (r"retrieved (document|text|content).{0,60}(ignore|override|disregard)", 2),
        (r"document (says|instructs).{0,60}(ignore|reveal|print)", 2),
        (r"hidden instruction", 2),
        (r"end of document\.?\s*now (ignore|follow)", 2),
    ],
    "misuse": [
        (r"write malware", 2),
        (r"create ransomware", 2),
        (r"hack into", 2),
        (r"build a (weapon|bomb)", 2),
        (r"phishing email", 2),
        (r"forge a (passport|document|signature)", 2),
        (r"steals? passwords", 1),
        (r"encrypt a .{0,30} network for payment", 1),
    ],
}

_COMPILED = {
    cls: [(re.compile(p, re.IGNORECASE), w) for p, w in rules]
    for cls, rules in POLICY_RULES.items()
}


def score_text(text):
    """Return {class: score} and {class: [matched pattern strings]}."""
    scores = {}
    matched = {}
    for cls, rules in _COMPILED.items():
        total = 0
        hits = []
        for rx, weight in rules:
            if rx.search(text):
                total += weight
                hits.append(rx.pattern)
        scores[cls] = total
        matched[cls] = hits
    return scores, matched


def _filter(text):
    scores, matched = score_text(text)
    top_class = max(scores, key=lambda c: scores[c]) if scores else None
    blocked = bool(top_class and scores[top_class] >= BLOCK_AT)
    if not blocked:
        top_class = None
    return {"blocked": blocked, "predicted_class": top_class,
            "scores": scores, "matched": matched}


def check_input(text):
    """Input filter. Block beats redact beats allow."""
    f = _filter(text)
    redacted, findings = redact(text)
    if f["blocked"]:
        action = "block"
    elif findings:
        action = "redact"
    else:
        action = "allow"
    return {"action": action, "blocked": f["blocked"],
            "predicted_class": f["predicted_class"], "scores": f["scores"],
            "matched": f["matched"], "findings": findings,
            "redacted_text": redacted}


def check_output(text):
    """Output filter. Same policy scoring, PII leakage is redacted."""
    return check_input(text)


def check(text, direction="input"):
    """Combined API. direction is input or output; both use the
    same Learn level rules, named separately for teaching clarity."""
    if direction not in ("input", "output"):
        raise ValueError("direction must be input or output")
    return check_input(text) if direction == "input" else check_output(text)
