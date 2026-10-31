"""Temperature scales. Base unit: kelvin."""

from .registry import register_unit

TEMPERATURE = "temperature"

register_unit("K", TEMPERATURE, 1, aliases=("kelvin",))
register_unit("C", TEMPERATURE, 1, offset="273.15", aliases=("celsius", "degC"))
register_unit(
    "F", TEMPERATURE, 5, divisor=9, offset="459.67", aliases=("fahrenheit", "degF")
)
