"""Length units. Base unit: metre."""

from .registry import register_unit

LENGTH = "length"

register_unit("m", LENGTH, 1.0, aliases=("metre", "meter", "metres", "meters"))
register_unit("km", LENGTH, 1000.0, aliases=("kilometre", "kilometer"))
register_unit("cm", LENGTH, 0.01, aliases=("centimetre", "centimeter"))
register_unit("mm", LENGTH, 0.001, aliases=("millimetre", "millimeter"))
register_unit("in", LENGTH, 0.0254, aliases=("inch", "inches"))
register_unit("ft", LENGTH, 0.3048, aliases=("foot", "feet"))
register_unit("yd", LENGTH, 0.9144, aliases=("yard", "yards"))
register_unit("mi", LENGTH, 1609.344, aliases=("mile", "miles"))
