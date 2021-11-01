import clsx from "clsx";
import type { ButtonHTMLAttributes, FC } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "danger";
	size?: "sm" | "md" | "lg";
	children: React.ReactNode;
}

const Button: FC<ButtonProps> = ({
	variant = "primary",
	size = "md",
	children,
	className,
	...props
}) => {
	const baseStyles =
		"inline-block font-bold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2";

	const variantStyles = {
		primary:
			"bg-blue-500 text-white border border-blue-500 hover:bg-blue-600 hover:border-blue-600",
		secondary:
			"bg-black text-white border border-black hover:text-black hover:bg-white",
		danger:
			"bg-red-500 text-white border border-red-500 hover:bg-red-600 hover:border-red-600",
	};

	const sizeStyles = {
		sm: "px-3 py-2 text-sm",
		md: "px-4 py-2 text-md",
		lg: "px-5 py-3 text-lg",
	};

	return (
		<button
			className={clsx(
				baseStyles,
				variantStyles[variant],
				sizeStyles[size],
				className,
			)}
			{...props}
		>
			{children}
		</button>
	);
};

export default Button;
