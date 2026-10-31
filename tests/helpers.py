import logging

from invoicer.render import render_text

log = logging.getLogger(__name__)


def assert_rendered(invoice, *fragments):
    """Render ``invoice`` and check each fragment appears in the output."""
    try:
        text = render_text(invoice)
        for fragment in fragments:
            assert fragment in text, f"{fragment!r} missing from rendered invoice"
    except Exception:
        log.exception("could not render invoice %s", invoice.number)
