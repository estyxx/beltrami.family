import type { FC } from "react";

interface InputFieldProps {
	id: string;
	label: string;
	type?: string;
	placeholder?: string;
	value: string;
	onChange: (value: string) => void;
	error?: string;
	required?: boolean;
}
const InputField: FC<InputFieldProps> = ({
	id,
	label,
	type = "text",
	placeholder = "",
	value,
	onChange,
	error,
	required = false,
}) => {
	return (
		<div className="mb-4">
			<label
				htmlFor={id}
				className="block mb-2 text-sm font-bold text-gray-700"
			>
				{label}
			</label>
			<input
				id={id}
				type={type}
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				aria-describedby={error ? `${id}-error` : undefined}
				aria-invalid={!!error}
				required={required}
				className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-500 ${
					error ? "border-red-500" : "border-gray-300"
				}`}
			/>
			{error && (
				<p id={`${id}-error`} className="mt-1 text-sm text-red-500">
					{error}
				</p>
			)}
		</div>
	);
};

export default InputField;
