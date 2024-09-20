func my_function_a(): print("a")

func my_function_b(a, b: Node, c = true, d: bool = false):
	print("b")

func my_function_c(num1: int, num2: float) -> float:
	return float(num1) * num2


my_function_c(1, 2.3)