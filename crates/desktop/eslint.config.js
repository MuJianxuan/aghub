import antfu from "@antfu/eslint-config";
import tailwind from "eslint-plugin-better-tailwindcss";

export default antfu({
	react: true,
	stylistic: false,
	imports: false,
})
	.removePlugins("perfectionist")
	.append({
		...tailwind.configs.recommended,
		settings: {
			"better-tailwindcss": {
				entryPoint: "./src/index.css",
			},
		},
	});
