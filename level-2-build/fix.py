"""The one targeted fix for the Build level. Stdlib only.

Target class: whichever class has the highest bypass rate after the
Learn guardrails (stage 2). In the measured run that class is
prompt_injection, whose attacks arrive in retrieved and tool text.
This fix therefore acts on retrieved and tool text only. It does
not touch the user channel, and the stage 3 results show that
limit honestly: user-channel classes keep most of their stage 2
bypass rate.

Mechanism, two parts, both real:
1. Quarantine. The text is split into sentences. A sentence that
   carries an instruction marker (a planted marker token or a
   "call tool <name>" suggestion) together with an imperative verb
   is replaced whole by [QUARANTINED INSTRUCTION]. The marker and
   the tool name leave the text, so there is nothing left to
   follow or to fire.
2. Data wrapping. The remaining text is wrapped between <<<DATA
   and DATA>>>. The stand-in targets in targets.py respect that
   delimiter: wrapped text is used as a fact surface but is never
   followed as an instruction. This is defence in depth if a
   marker sentence survives part 1 (for example a marker with no
   imperative verb, which part 1 keeps and the target then ignores
   because it sits inside the delimiters).

Limits: sentence splitting is naive (a period ends a sentence),
the imperative list is finite, and a real system would need this
at the prompt construction layer, not as a text post-process.
Those limits are named in REPORT.md (Build section).
"""
import re

from targets import CALL_TOOL_RE, DATA_CLOSE, DATA_OPEN, IMPERATIVE_RE, MARKER_RE

QUARANTINED = "[QUARANTINED INSTRUCTION]"


def _is_instruction_sentence(sentence):
    has_marker = bool(MARKER_RE.search(sentence)
                      or CALL_TOOL_RE.search(sentence))
    return has_marker and bool(IMPERATIVE_RE.search(sentence))


def quarantine_fix(text):
    """Quarantine instruction sentences, then wrap as data."""
    if not text:
        return text
    sentences = re.split(r"(?<=[.])\s+", text)
    kept = [QUARANTINED if _is_instruction_sentence(s) else s
            for s in sentences]
    return DATA_OPEN + "\n" + " ".join(kept) + "\n" + DATA_CLOSE
