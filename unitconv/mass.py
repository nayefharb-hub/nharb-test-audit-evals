"""Mass units. Base unit: kilogram."""

from .registry import register_unit

MASS = "mass"

register_unit("kg", MASS, "1", aliases=("kilogram", "kilograms"))
register_unit("g", MASS, "0.001", aliases=("gram", "grams"))
register_unit("mg", MASS, "0.000001", aliases=("milligram", "milligrams"))
register_unit("t", MASS, "1000", aliases=("tonne", "tonnes"))
register_unit("lb", MASS, "0.45359237", aliases=("pound", "pounds", "lbs"))
register_unit("oz", MASS, "0.028349523125", aliases=("ounce", "ounces"))
register_unit("st", MASS, "6.35029318", aliases=("stone",))
